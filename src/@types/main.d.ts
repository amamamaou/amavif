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

/** 変換情報Store */
interface ImagesStore {
  standby: FileInfoMap;
  complete: FileInfoMap;
  format: ImageFormat;
  quality: number;
  output: string;
  isProcessing: boolean;
  isLoading: boolean;
  load: {
    total: number;
    count: number;
  };
}

/** 画像ファイル読み込み時のお知らせフラグ */
interface FileLoadFlags {
  duplicate: boolean;
  directory: boolean;
  unsupported: boolean;
}
