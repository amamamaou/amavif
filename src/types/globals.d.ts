export namespace Amavif {
  /** 変換する画像フォーマット */
  type Format = 'webp' | 'avif'

  /** 変換対象のMIMEタイプ */
  type MIMEType = `image/${'jpeg' | 'png' | 'webp'}`

  /** 画像パスデータ */
  interface PathData {
    path: string;
    dir: string[];
  }

  /** 画像情報 */
  interface ImageInfo extends PathData {
    uuid: string;
    fileName: string,
    fileSize: number;
    mime: MIMEType;
  }

  /** マップ用画像情報 */
  interface Info extends PathData {
    fileName: string;
    baseName: string;
    mime: 'image/avif' | MIMEType;
    fileSrc: string;
    size: {
      before: number;
      after: number;
    };
  }

  /** UUIDによる画像情報のマップ */
  type InfoMap = Map<string, Info>

  /** 変換データ */
  interface ConvertedData {
    uuid: string,
    path: string,
    fileSize: number,
  }
}
