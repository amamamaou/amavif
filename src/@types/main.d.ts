/** 変換する形式 */
type ImageFormat = 'webp' | 'avif'

/** 許可する変換対象のMIMEタイプ */
type AllowInputMIMEType = `image/${'jpeg' | 'png' | 'webp'}`

/** 扱いうる画像のMIMEタイプ */
type ImageMIMEType = 'image/avif' | AllowInputMIMEType

/** ファイルサイズデータ */
interface FileSizeData {
  before: number;
  after: number;
}

/** 画像の情報 */
interface FileInfo {
  path: string;
  fileName: string;
  baseName: string;
  directory?: string;
  mimeType: ImageMIMEType;
  fileSrc: string;
  size: FileSizeData;
}

/** UUIDによる画像情報のマップ */
type FileInfoMap = Map<string, FileInfo>

/** 処理ステート */
type ProcessingStatus = 'idle' | 'loading' | 'converting'

/** 処理データ */
interface ProgressData {
  count: number;
  total: number;
}

/** 画像ストアState */
interface ImagesState {
  standby: FileInfoMap;
  complete: FileInfoMap;
  format: ImageFormat;
  quality: number;
  output: string;
  status: ProcessingStatus;
  progress: ProgressData;
}

/** 画像ファイル読み込み時のお知らせフラグ */
interface FileLoadFlags {
  directory: boolean;
  duplicate: boolean;
  unsupported: boolean;
}
