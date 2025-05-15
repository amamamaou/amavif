use image::error::ImageResult;
use ravif::Encoder as AvifEncoder;
use rayon::iter::{IntoParallelRefIterator, ParallelIterator};
use rgb::FromSlice;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Emitter;
use webp::Encoder as WebpEncoder;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            get_mime_type,
            get_file_size,
            convert_images,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[derive(Debug, Serialize, Deserialize)]
struct FileInfo {
    uuid: String,
    path: String,
    file_name: String,
}

#[derive(Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
enum ExtensionType {
    Webp,
    Avif,
}

// 画像形式判別
impl ExtensionType {
    fn get_extension_str(&self) -> &str {
        match self {
            ExtensionType::Webp => "webp",
            ExtensionType::Avif => "avif",
        }
    }
}

// ファイルの MIME Type を取得する
#[tauri::command]
fn get_mime_type(path: String) -> String {
    let data = fs::read(&path).unwrap_or(vec![]);
    infer::get(&data)
        .map(|kind| kind.mime_type())
        .unwrap_or("application/octet-stream")
        .to_string()
}

// ファイルサイズを取得する
#[tauri::command]
fn get_file_size(path: String) -> u64 {
    fs::metadata(&path)
        .map(|meta| meta.len())
        .unwrap_or(0)
}

// WebP変換処理
fn encode_to_webp(path: String, output_path: &PathBuf, quality: u8) -> ImageResult<()> {
    let img = image::open(path)?;
    let webp_data = WebpEncoder::from_image(&img)
        .unwrap()
        .encode(quality as f32);

    fs::write(output_path, &*webp_data).unwrap();

    Ok(())
}

// AVIF変換処理
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

// 画像変換処理
#[tauri::command]
async fn convert_images(
    app: tauri::AppHandle,
    file_data: Vec<FileInfo>,
    format: ExtensionType,
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
            let output_path = output_dir
                .join(format!("{}.{}", item.file_name, format.get_extension_str()));

            match format {
                ExtensionType::Webp => {
                    encode_to_webp(item.path.clone(), &output_path, quality).ok()?;
                }

                ExtensionType::Avif => {
                    encode_to_avif(item.path.clone(), &output_path, quality).ok()?;
                }
            }

            // 進行状況を通知
            app.emit(
                "progress",
                ConvertProgress { uuid: item.uuid.clone() },
            )
                .ok()
                .unwrap();

            Some((item.uuid.clone(), output_path))
        })
        .collect::<Vec<_>>();

    Ok(output_data)
}
