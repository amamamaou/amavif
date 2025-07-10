use image::error::ImageError;
use imgref::Img;
use ravif::{Encoder as AvifEncoder, Error as AvifEncodingError};
use rgb::FromSlice;
use std::{fs, io};
use std::path::Path;
use thiserror::Error;
use webp::{Encoder as WebpEncoder};

/// WebPエンコードエラー
#[derive(Error, Debug)]
pub enum WebpError {
    /// 画像ファイルの読み込み中に発生したエラー
    #[error("Failed to open image: {0}")]
    ImageOpenError(#[from] ImageError),

    /// WebPエンコード中に発生したエラー
    #[error("WebP encoding failed: {0}")]
    WebpEncodingError(String),

    /// 出力ファイルへの書き込み中に発生したエラー
    #[error("Failed to write output file: {0}")]
    IoError(#[from] io::Error),
}

/// WebP変換処理
pub fn to_webp(
    path: &String,
    output_path: &Path,
    quality: u8,
) -> Result<(), WebpError> {
    let img = image::open(path)?;

    let webp_data = WebpEncoder::from_image(&img)
        .map_err(|e| WebpError::WebpEncodingError(e.to_string()))?
        .encode(quality as f32)
        .to_vec();

    fs::write(output_path, webp_data)?;

    Ok(())
}

/// AVIFエンコードエラー
#[derive(Error, Debug)]
pub enum AvifError {
    /// 画像ファイルの読み込み中に発生したエラー
    #[error("Failed to open image: {0}")]
    ImageOpenError(#[from] ImageError),

    /// AVIF変換のエラー
    #[error("Avif encoding failed: {0}")]
    AvifEncodingError(#[from] AvifEncodingError),

    /// 出力ファイルへの書き込み中に発生したエラー
    #[error("Failed to write output file: {0}")]
    IoError(#[from] io::Error),
}

/// AVIF変換処理
pub fn to_avif(
    path: &String,
    output_path: &Path,
    quality: u8,
) -> Result<(), AvifError> {
    let img = image::open(path)?;
    let buffer = img.to_rgba8();

    let new_img = Img::new(
        buffer.as_rgba(),
        img.width() as usize,
        img.height() as usize,
    );

    let res = AvifEncoder::new()
        .with_quality(quality as f32)
        .encode_rgba(new_img)?;

    fs::write(output_path, res.avif_file)?;

    Ok(())
}
