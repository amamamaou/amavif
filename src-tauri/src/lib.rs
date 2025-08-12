mod encode;

use rayon::iter::{IntoParallelRefIterator, ParallelIterator};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use tauri::Emitter;
use uuid::Uuid;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            get_image_info,
            convert_images,
            check_existing_files,
            open_file_explorer,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// ファイルパスからUUIDを生成する
fn generate_uuid(path: &Path) -> String {
    let path_str = path.to_string_lossy();
    let ns = Uuid::NAMESPACE_URL;
    let uuid = Uuid::new_v5(&ns, path_str.as_bytes());
    uuid.to_string()
}

/// 拡張子を見て画像か判別する
fn is_image_file(path: &Path) -> bool {
    if let Some(ext) = path.extension() {
        let ext_str = ext.to_string_lossy().to_lowercase();
        matches!(ext_str.as_str(), "jpg" | "jpeg" | "png" | "webp")
    } else {
        false
    }
}

/// ファイルのMIMEタイプを見て画像か判断する
fn get_image_mime(path: &Path) -> Option<String> {
    if let Ok(Some(kind)) = infer::get_from_path(&path) {
        let mime = kind.mime_type();
        matches!(mime, "image/jpeg" | "image/png" | "image/webp")
            .then(|| mime.to_string())
    } else {
        None
    }
}

/// ファイルサイズを取得する
fn get_file_size(path: &Path) -> u64 {
    fs::metadata(&path)
        .map(|meta| meta.len())
        .unwrap_or(0)
}

/// 有効なフォルダ/ディレクトリかチェックする
fn is_active_dir(path: &Path) -> bool {
    if !path.is_dir() {
        return false;
    }

    // ドットから始まるディレクトリを除外する
    if let Some(name) = path.file_name() {
        if name.to_string_lossy().starts_with(".") {
            return false;
        }
    }

    // Windowsの場合は隠し属性もチェックする
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::fs::MetadataExt;
        fs::metadata(path)
            .map(|meta| meta.file_attributes() & 0x2 == 0)
            .unwrap_or(false)
    }

    #[cfg(not(target_os = "windows"))]
    {
        true
    }
}

/// パス情報
#[derive(Debug)]
struct PathData {
    path: PathBuf,
    dir: Vec<String>,
}

/// 再帰的に複数階層のフォルダから画像のパスを取得する
fn get_image_path_recursive(
    current_path: &Path,
    base_dirs: Vec<String>,
    image_paths: &mut Vec<PathData>,
) -> Result<(), String> {
    let entries = fs::read_dir(current_path)
        .map_err(|e| e.to_string())?;

    // ディレクトリ配下を取得
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        if path.is_file() {
            if is_image_file(&path) {
                image_paths.push(PathData {
                    path,
                    dir: base_dirs.clone(),
                });
            }
        } else if is_active_dir(&path) {
            // ディレクトリの場合は再帰的に取得する
            if let Some(dir_name_os) = path.file_name() {
                let mut new_base_dirs = base_dirs.clone();
                new_base_dirs.push(dir_name_os.to_string_lossy().to_string());
                get_image_path_recursive(&path, new_base_dirs, image_paths)?;
            }
        }
    }

    Ok(())
}

/// 画像情報
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ImageInfo {
    uuid: String,
    path: PathBuf,
    file_name: String,
    file_size: u64,
    mime: String,
    dir: Vec<String>,
}

/// パスを整えて画像情報を取得する
#[tauri::command]
async fn get_image_info(
    app: tauri::AppHandle,
    paths: Vec<String>,
) -> Result<Vec<ImageInfo>, String> {
    let mut image_paths: Vec<PathData> = Vec::new();

    // 画像のパスを取得する
    for path_str in paths {
        let path = PathBuf::from(&path_str);

        if path.is_file() {
            if is_image_file(&path) {
                image_paths.push(PathData {
                    path,
                    dir: Vec::new(),
                });
            }
        } else if is_active_dir(&path) {
            // ディレクトリの場合は再帰的に取得する
            if let Some(dir_name_os) = path.file_name() {
                let mut base_dirs = Vec::new();
                base_dirs.push(dir_name_os.to_string_lossy().to_string());
                get_image_path_recursive(&path, base_dirs, &mut image_paths)?;
            }
        }
    }

    // 全体のパスの数を通知
    app.emit("total", image_paths.len())
        .map_err(|e| e.to_string())?;

    // 画像情報を取得する
    let image_infos = image_paths
        .par_iter()
        .filter_map(|data| {
            if let Some(mime) = get_image_mime(&data.path) {
                let file_name = data.path.file_name()?.to_string_lossy().into_owned();
                let file_size = get_file_size(&data.path);

                app.emit("progress", {}).ok()?;

                Some(ImageInfo {
                    uuid: generate_uuid(&data.path),
                    path: data.path.clone(),
                    file_name,
                    file_size,
                    mime,
                    dir: data.dir.clone(),
                })
            } else {
                app.emit("progress", {}).ok()?;
                None
            }
        })
        .collect::<Vec<_>>();

    Ok(image_infos)
}

/// ファイル情報
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct FileInfo {
    uuid: String,
    path: String,
    file_name: String,
    dir: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ImageOptions {
    format: String,
    quality: u8,
    output: String,
}

/// 変換後データ
#[derive(Debug, Serialize, Deserialize)]
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
    options: ImageOptions,
) -> Result<Vec<ConvertedData>, String> {
    // フォーマットチェック
    if !matches!(options.format.as_str(), "avif" | "webp") {
        return Err(format!("Unknown format: {}", options.format));
    }

    let output_dir = PathBuf::from(&options.output);

    // もしディレクトリが存在しない場合は作る
    if !output_dir.is_dir() {
        fs::create_dir_all(&output_dir)
            .map_err(|e| {
                format!("Failed to create directory {}: {}", output_dir.display(), e)
            })?;
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
            output_path.push(&item.file_name);

            let path = PathBuf::from(&item.path);

            // 各種エンコード
            if options.format == "webp" {
                encode::to_webp(&path, &output_path, options.quality).ok()?;
            } else if options.format == "avif" {
                encode::to_avif(&path, &output_path, options.quality).ok()?;
            }

            // ファイルサイズ計算
            let file_size = get_file_size(&output_path);

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
            output_path.push(item.file_name);

            if output_path.is_file() {
                // ファイルサイズ計算
                let file_size = get_file_size(&output_path);

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

    Ok(())
}
