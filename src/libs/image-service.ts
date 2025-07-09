import { convertFileSrc, invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { basename } from '@tauri-apps/api/path'
import { isAllowInputMIMEType, sleep } from '@/libs/utils'
import { convertNotification, loadNotification, type FileLoadFlags } from '@/libs/notification'
import useImageStore from '@/store/image'

/** パスデータ */
interface PathData {
  uuid: string;
  path: string;
  dir: string[];
}

/** 変換データ */
interface ConvertedData {
  uuid: string,
  path: string,
  fileSize: number,
}

/** 画像ファイルを追加する */
export async function addImages(paths: string[]): Promise<void> {
  if (paths.length === 0) {
    loadNotification({ empty: true })
    return
  }

  const image = useImageStore()
  image.initProgress('loading')

  // フォルダを含むパスから画像ファイルを抽出する
  const pathData = await invoke<PathData[]>('collect_image_paths', { paths })
  image.progress.total = pathData.length

  /** 通知フラグ */
  const flags: FileLoadFlags = {
    empty: pathData.length === 0,
  }

  // パスから画像情報を取得する
  for (const { uuid, path, dir } of pathData) {
    // 重複しているか
    if (image.standby.has(uuid)) {
      flags.duplicate = true
      image.progress.count++
      continue
    }

    // 完了データに存在する場合は取り除く
    image.complete.delete(uuid)

    // MIMEタイプ取得
    const mimeType = await invoke<string>('get_mime_type', { path })

    // 変換対象の画像形式か確認
    if (isAllowInputMIMEType(mimeType)) {
      const fileName = await basename(path)
      const fileSize = await invoke<number>('get_file_size', { path })

      image.standby.set(uuid, {
        path,
        fileName: [...dir, fileName].join('/'),
        baseName: fileName.replace(/\.\w+$/, ''),
        dir,
        mimeType,
        fileSrc: convertFileSrc(path),
        size: { before: fileSize, after: 0 },
      })
    } else {
      flags.unsupported = true
    }

    image.progress.count++
  }

  image.done()

  loadNotification(flags)
}

/** 画像を変換する */
export async function convertImages(): Promise<void> {
  const image = useImageStore()
  const { format, quality, output } = image
  let isSuccess = true
  let message = ''

  image.initProgress('converting', image.standby.size)

  /** Tauri側へ渡す値 */
  const fileData = [...image.standby.entries()]
    .map(([uuid, { path, baseName, dir }]) => {
      const name = `${baseName}.${format}`
      return { uuid, path, name, dir }
    })

  // 進捗処理イベント
  const unlisten = await listen('progress', () => image.progress.count++)

  // 変換開始
  const result = await invoke<ConvertedData[]>(
    'convert_images',
    { fileData, format, quality, output },
  ).catch((error) => {
    isSuccess = false

    if (error instanceof Error) {
      message = error.message
    } else if (typeof error === 'string') {
      message = error
    } else {
      message = 'Unknown Error'
    }

    // 変換成功したものだけ取得する
    return invoke<ConvertedData[]>('check_existing_files', { fileData, output })
  })

  unlisten()

  // 部分的に変換されなかったものがあった場合
  if (isSuccess && result.length < fileData.length) {
    message = 'Partial Error'
  }

  // データ整理
  for (const { uuid, path, fileSize } of result) {
    const orig = image.standby.get(uuid)
    if (!orig) continue

    image.complete.set(uuid, {
      path,
      fileName: [...orig.dir, `${orig.baseName}.${format}`].join('/'),
      baseName: orig.baseName,
      dir: orig.dir,
      mimeType: `image/${format}`,
      fileSrc: convertFileSrc(path),
      size: {
        before: orig.size.before,
        after: fileSize,
      },
    })
    image.backup.set(uuid, orig)
    image.standby.delete(uuid)
  }

  await sleep(400)

  image.done()

  convertNotification(isSuccess, message)
}
