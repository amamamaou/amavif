export namespace Amavif {
  /** 変換する画像フォーマット */
  type Format = 'webp' | 'avif'

  /** 変換対象のMIMEタイプ */
  type MIMEType = `image/${'jpeg' | 'png' | 'webp'}`

  /** ファイルサイズデータ */
  interface FileSize {
    before: number;
    after: number;
  }

  /** 画像の情報 */
  interface Info {
    path: string;
    fileName: string;
    baseName: string;
    directory?: string;
    mimeType: 'image/avif' | MIMEType;
    fileSrc: string;
    size: FileSize;
  }

  /** UUIDによる画像情報のマップ */
  type InfoMap = Map<string, Info>
}
