import { convertFileSrc, invoke } from '@tauri-apps/api/core'
import { once, listen } from '@tauri-apps/api/event'
import { getErrorMessage, sleep } from '@/libs/utils'
import notification from '@/libs/notification'
import useImageStore from '@/store/image'

/** 画像情報 */
interface ImageInfo {
  uuid: string;
  path: string;
  fileName: string,
  fileSize: number;
  mime: Amavif.MIMEType;
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
    notification.load.empty()
    return
  }

  const image = useImageStore()
  image.initProgress('loading')

  // 進捗イベント
  const unlistenTotal = await once<number>('total', (event) => {
    image.progress.total = event.payload
  })
  const unlistenProgress = await listen('progress', () => image.progress.count++)

  try {
    // パスから画像情報を取得する
    const imageInfos = await invoke<ImageInfo[]>('get_image_info', { paths })

    if (imageInfos.length === 0) {
      notification.load.empty()
      return
    }

    // 一時的な非リアクティブMapを作る
    const newStandby = new Map(image.standby)
    const newComplete = new Map(image.complete)

    // パスから画像情報を取得する
    for (const { uuid, path, fileName, fileSize, mime, dir } of imageInfos) {
      // 完了データに存在する場合は取り除く
      newComplete.delete(uuid)

      newStandby.set(uuid, {
        path,
        fileName: [...dir, fileName].join('/'),
        baseName: fileName.replace(/\.\w+$/, ''),
        dir,
        mime,
        fileSrc: convertFileSrc(path),
        size: { before: fileSize, after: 0 },
      })
    }

    image.standby = newStandby
    image.complete = newComplete

    await nextTick()
    await sleep(400)
  } catch (error) {
    notification.load.failed(getErrorMessage(error))
  } finally {
    unlistenTotal()
    unlistenProgress()
    image.done()
  }
}

/** 画像を変換する */
export async function convertImages(): Promise<void> {
  const image = useImageStore()
  const { format, quality, output } = image.options
  let errMsg = ''

  image.initProgress('converting', image.standby.size)

  /** Tauri側へ渡す値 */
  const fileData = [...image.standby.entries()]
    .map(([uuid, { path, baseName, dir }]) => {
      const fileName = `${baseName}.${format}`
      return { uuid, path, fileName, dir }
    })

  // 進捗処理イベント
  const unlisten = await listen('progress', () => image.progress.count++)

  // 変換開始
  const result = await invoke<ConvertedData[]>(
    'convert_images',
    { fileData, format, quality, output },
  ).catch((error) => {
    errMsg = getErrorMessage(error)

    // 変換成功したものだけ取得する
    return invoke<ConvertedData[]>('check_existing_files', { fileData, output })
  })

  unlisten()

  // 一時的な非リアクティブMapを作る
  const newStandby = new Map(image.standby)
  const newComplete = new Map(image.complete)
  const newBackup = new Map(image.backup)

  // データ整理
  for (const { uuid, path, fileSize } of result) {
    const orig = newStandby.get(uuid)
    if (!orig) continue

    newComplete.set(uuid, {
      path,
      fileName: [...orig.dir, `${orig.baseName}.${format}`].join('/'),
      baseName: orig.baseName,
      dir: orig.dir,
      mime: `image/${format}`,
      fileSrc: convertFileSrc(path),
      size: {
        before: orig.size.before,
        after: fileSize,
      },
    })
    newBackup.set(uuid, orig)
    newStandby.delete(uuid)
  }

  image.standby = newStandby
  image.complete = newComplete
  image.backup = newBackup

  await nextTick()
  await sleep(400)

  image.done()

  if (errMsg) {
    notification.convert.failed(errMsg)
  } else if (result.length < fileData.length) {
    notification.convert.partial()
  } else {
    notification.convert.success()
  }
}
