use image::error::ImageResult;
use ravif::Encoder as AvifEncoder;
use rayon::iter::{IntoParallelRefIterator, ParallelIterator};
use rgb::FromSlice;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use tauri::Emitter;
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
            get_image_files_in_dir,
            convert_images,
            open_file_explorer,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// ファイル情報
#[derive(Debug, Serialize, Deserialize)]
struct FileInfo {
    uuid: String,
    path: String,
    file_name: String,
    directory: String,
}

/// ファイルの MIME Type を取得する
#[tauri::command]
fn get_mime_type(path: String) -> String {
    let result = if Path::new(&path).is_dir() {
        "directory"
    } else if let Ok(Some(kind)) = infer::get_from_path(&path) {
        kind.mime_type()
    } else {
        "unknown"
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

/// 対象とする画像の拡張子
const IMAGE_EXTENSIONS: [&str; 4] = ["png", "jpg", "jpeg", "webp"];

/// 指定したディレクトリの直下にある画像ファイルのパスを取得する
#[tauri::command]
fn get_image_files_in_dir(path: String) -> Vec<String> {
    let path = Path::new(&path);
    let mut image_files = Vec::new();

    // ディレクトリ配下を取得
    if let Ok(entries) = fs::read_dir(path) {
        for entry in entries.flatten() {
            let path = entry.path();

            if path.is_file() {
                if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                    if IMAGE_EXTENSIONS.iter().any(|&e| e.eq_ignore_ascii_case(ext)) {
                        // PathBuf → String へ変換
                        if let Some(p) = path.to_str() {
                            image_files.push(p.to_string());
                        }
                    }
                }
            }
        }
    }

    image_files
}

/// WebP変換処理
fn encode_to_webp(path: String, output_path: &PathBuf, quality: u8) -> ImageResult<()> {
    let img = image::open(path)?;

    let webp_data = WebpEncoder::from_image(&img)
        .unwrap()
        .encode(quality as f32);

    fs::write(output_path, &*webp_data).unwrap();

    Ok(())
}

/// AVIF変換処理
fn encode_to_avif(path: String, output_path: &PathBuf, quality: u8) -> ImageResult<()> {
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

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ConvertProgress {
    uuid: String,
}

/// 画像変換処理
#[tauri::command]
async fn convert_images(
    app: tauri::AppHandle,
    file_data: Vec<FileInfo>,
    format: String,
    quality: u8,
    output: String,
) -> Result<Vec<(String, PathBuf)>, tauri::Error> {
    let output_dir = PathBuf::from(&output);

    // もしディレクトリが存在しない場合は作る
    if !output_dir.is_dir() {
        std::fs::create_dir_all(&output_dir)?;
    }

    // rayonで並列処理を行う
    let output_data = file_data
        .par_iter()
        .filter_map(|item| {
            let mut output_path = output_dir.clone();

            // ディレクトリ持ちの場合
            if !item.directory.is_empty() {
                output_path = output_path.join(item.directory.clone());

                // もしディレクトリが存在しない場合は作る
                if !output_path.is_dir() {
                    std::fs::create_dir_all(&output_path).ok()?;
                }
            }

            // ファイル名と拡張子を結合する
            output_path = output_path.join(format!("{}.{}", item.file_name, format));

            if format == String::from("webp") {
                encode_to_webp(item.path.clone(), &output_path, quality).ok()?;
            } else if format == String::from("avif") {
                encode_to_avif(item.path.clone(), &output_path, quality).ok()?;
            }

            // 進行状況を通知
            app.emit(
                "progress",
                ConvertProgress { uuid: item.uuid.clone() },
            ).ok()?;

            Some((item.uuid.clone(), output_path))
        })
        .collect::<Vec<_>>();

    Ok(output_data)
}

/// 指定したパスを開く
#[tauri::command]
fn open_file_explorer(path: String) -> Result<(), String> {
    let path = PathBuf::from(path);

    if !path.exists() {
        return Err("Oops! That path doesn’t seem to exist.".into());
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

    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}
