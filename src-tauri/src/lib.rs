use image::error::ImageResult;
use ravif::Encoder as AvifEncoder;
use rayon::iter::{IntoParallelRefIterator, ParallelIterator};
use rgb::FromSlice;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use tauri::Emitter;
use uuid::Uuid;
use webp::Encoder as WebpEncoder;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            get_mime_type,
            get_file_size,
            collect_image_paths,
            convert_images,
            check_existing_files,
            open_file_explorer,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// ファイルの MIME Type を取得する
#[tauri::command]
fn get_mime_type(path: String) -> String {
    let result = if Path::new(&path).is_dir() {
        "directory"
    } else if let Ok(Some(kind)) = infer::get_from_path(&path) {
        kind.mime_type()
    } else {
        "application/octet-stream"
    };
    result.to_string()
}

/// ファイルサイズを取得する
#[tauri::command]
fn get_file_size(path: String) -> u64 {
    fs::metadata(&path)
        .map(|meta| meta.len())
        .unwrap_or(0)
}

/// ファイルパスからUUIDを生成する
fn generate_uuid(path: &String) -> String {
    let ns = Uuid::NAMESPACE_URL;
    let uuid = Uuid::new_v5(&ns, path.as_bytes());
    uuid.to_string()
}

/// フロントエンドに返す画像のパスとディレクトリ情報を保持する構造体
#[derive(Debug, Serialize, Deserialize)]
struct PathData {
    uuid: String,
    path: String,
    dir: Vec<String>,
}

/// 画像の拡張子を判定するヘルパー関数
fn is_image_file(path: &Path) -> bool {
    if let Some(ext) = path.extension() {
        let ext_str = ext.to_string_lossy().to_lowercase();
        matches!(ext_str.as_str(), "jpg" | "jpeg" | "png" | "webp")
    } else {
        false
    }
}

/// ディレクトリを再帰的に走査し、画像ファイルとディレクトリ階層を収集する
fn collect_image_paths_recursive(
    current_path: &Path,
    base_dirs: Vec<String>,
    image_infos: &mut Vec<PathData>,
) -> Result<(), String> {
    // ディレクトリ配下を取得
    for entry in fs::read_dir(current_path).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        if path.is_file() {
            // 画像ファイルの場合がそのまま格納
            if is_image_file(&path) {
                let file_path = path.to_string_lossy().to_string();
                image_infos.push(PathData {
                    uuid: generate_uuid(&file_path),
                    path: file_path,
                    dir: base_dirs.clone(),
                });
            }
        } else if path.is_dir() {
            // ディレクトリの場合は再帰的に取得する
            if let Some(dir_name_os) = path.file_name() {
                let mut new_base_dirs = base_dirs.clone();
                new_base_dirs.push(dir_name_os.to_string_lossy().to_string());
                collect_image_paths_recursive(&path, new_base_dirs, image_infos)?;
            }
        }
    }
    Ok(())
}

/// パスを整える
#[tauri::command]
async fn collect_image_paths(paths: Vec<String>) -> Result<Vec<PathData>, String> {
    let mut image_infos: Vec<PathData> = Vec::new();

    for path_str in paths {
        let path = PathBuf::from(&path_str);

        if path.is_file() {
            // 画像ファイルの場合がそのまま格納
            if is_image_file(&path) {
                let file_path = path.to_string_lossy().to_string();
                image_infos.push(PathData {
                    uuid: generate_uuid(&file_path),
                    path: file_path,
                    dir: Vec::new(),
                });
            }
        } else if path.is_dir() {
            // ディレクトリの場合は再帰的に取得する
            if let Some(dir_name_os) = path.file_name() {
                let mut base_dirs = Vec::new();
                base_dirs.push(dir_name_os.to_string_lossy().to_string());
                collect_image_paths_recursive(&path, base_dirs, &mut image_infos)?;
            }
        }
    }

    Ok(image_infos)
}

/// WebP変換処理
fn encode_to_webp(path: &String, output_path: &PathBuf, quality: u8) -> ImageResult<()> {
    let img = image::open(path)?;

    let webp_data = WebpEncoder::from_image(&img)
        .unwrap()
        .encode(quality as f32);

    fs::write(output_path, &*webp_data).unwrap();

    Ok(())
}

/// AVIF変換処理
fn encode_to_avif(path: &String, output_path: &PathBuf, quality: u8) -> ImageResult<()> {
    let img = image::open(path)?;
    let buffer = img.to_rgba8();

    let new_img = imgref::Img::new(
        buffer.as_rgba(),
        img.width() as usize,
        img.height() as usize,
    );

    let avif_data = AvifEncoder::new()
        .with_quality(quality as f32)
        .encode_rgba(new_img)
        .unwrap()
        .avif_file;

    fs::write(output_path, &avif_data).unwrap();

    Ok(())
}

/// ファイル情報
#[derive(Debug, Serialize, Deserialize)]
struct FileInfo {
    uuid: String,
    path: String,
    name: String,
    dir: Vec<String>,
}

/// 変換後データ
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ConvertedData {
    uuid: String,
    path: PathBuf,
    file_size: u64,
}

/// 画像変換処理
#[tauri::command]
async fn convert_images(
    app: tauri::AppHandle,
    file_data: Vec<FileInfo>,
    format: String,
    quality: u8,
    output: String,
) -> Result<Vec<ConvertedData>, tauri::Error> {
    let output_dir = PathBuf::from(&output);

    // もしディレクトリが存在しない場合は作る
    if !output_dir.is_dir() {
        fs::create_dir_all(&output_dir)?;
    }

    // rayonで並列処理を行う
    let output_data = file_data
        .par_iter()
        .filter_map(|item| {
            let mut output_path = output_dir.clone();

            // ディレクトリ持ちの場合
            if !item.dir.is_empty() {
                for d in &item.dir {
                    output_path.push(d);
                }

                // もしディレクトリが存在しない場合は作る
                if !output_path.is_dir() {
                    fs::create_dir_all(&output_path).ok()?;
                }
            }

            // ファイル名を結合する
            output_path.push(&item.name);

            if format == String::from("webp") {
                encode_to_webp(&item.path, &output_path, quality).ok()?;
            } else if format == String::from("avif") {
                encode_to_avif(&item.path, &output_path, quality).ok()?;
            }

            // ファイルサイズ計算
            let file_size = fs::metadata(&output_path)
                .map(|meta| meta.len())
                .unwrap_or(0);

            // 進行状況を通知
            app.emit("progress", {}).ok()?;

            Some(ConvertedData {
                uuid: item.uuid.clone(),
                path: output_path,
                file_size,
            })
        })
        .collect::<Vec<_>>();

    Ok(output_data)
}

/// 変換したファイルが存在するか確認
#[tauri::command]
async fn check_existing_files(
    file_data: Vec<FileInfo>,
    output: String,
) -> Vec<ConvertedData> {
    let output_dir = PathBuf::from(&output);

    file_data
        .into_iter()
        .filter_map(|item| {
            let mut output_path = output_dir.clone();

            // ディレクトリ持ちの場合
            if !item.dir.is_empty() {
                for d in &item.dir {
                    output_path.push(d);
                }
            }

            // ファイル名を結合する
            output_path.push(item.name);

            if output_path.is_file() {
                // ファイルサイズ計算
                let file_size = fs::metadata(&output_path)
                    .map(|meta| meta.len())
                    .unwrap_or(0);

                Some(ConvertedData {
                    uuid: item.uuid,
                    path: output_path,
                    file_size,
                })
            } else {
                None
            }
        })
        .collect()
}

/// 指定したパスを開く
#[tauri::command]
fn open_file_explorer(path: String) -> Result<(), String> {
    let path = PathBuf::from(path);

    if !path.exists() {
        return Err("Oops! That output path doesn’t seem to exist.".into());
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(path.to_str().ok_or("Oops! That’s not a valid path.")?)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    // #[cfg(target_os = "linux")]
    // {
    //     Command::new("xdg-open")
    //         .arg(&path)
    //         .spawn()
    //         .map_err(|e| e.to_string())?;
    // }

    Ok(())
}
