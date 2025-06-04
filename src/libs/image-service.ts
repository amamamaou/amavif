import { convertFileSrc, invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { basename } from '@tauri-apps/api/path'
import { isAllowInputMIMEType, sleep } from '@/libs/utils'
import { convertNotification, loadNotification } from '@/libs/notification'
import useImageStore from '@/store/image'

/** 整えられたパスデータ */
interface CollectedPathData {
  uuid: string;
  path: string;
  directory?: string;
}

/** 変換データ */
interface ConvertedData {
  uuid: string,
  path: string,
  fileSize: number,
}

/** ディレクトリが含まれるパスを整える */
async function collectPaths(
  paths: string[],
  directory?: string,
): Promise<{
  pathData: CollectedPathData[];
  hasSubDir: boolean;
}> {
  const pathData: CollectedPathData[] = []
  let hasSubDir = false

  for (const path of paths) {
    const isDirectory = await invoke<boolean>('is_directory', { path })

    // ディレクトリかどうか
    if (isDirectory) {
      // 再帰的処理は行わない
      if (directory) {
        hasSubDir = true
        continue
      }

      // 直下の画像ファイルを取得する
      const newPaths = await invoke<string[]>('get_image_files_in_dir', { path })
      const dirName = await basename(path)
      const children = await collectPaths(newPaths, dirName)

      if (children.hasSubDir) hasSubDir = true

      pathData.push(...children.pathData)
    } else {
      const uuid = await invoke<string>('generate_uuid', { path })
      pathData.push({ uuid, path, directory })
    }
  }

  return { pathData, hasSubDir }
}

/** 画像ファイルを追加する */
export async function addImages(paths: string[]): Promise<void> {
  if (paths.length === 0) return

  const image = useImageStore()
  image.initProgress('loading')

  // ディレクトリが含まれる場合があるので先に整える
  const { pathData, hasSubDir } = await collectPaths(paths)
  image.progress.total = pathData.length

  /** 通知フラグ */
  const flags: FileLoadFlags = {
    directory: hasSubDir,
    duplicate: false,
    unsupported: false,
  }

  // パスから画像情報を取得する
  for (const { uuid, path, directory } of pathData) {
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
        fileName: (directory ? directory + '/' : '') + fileName,
        baseName: fileName.replace(/\.\w+$/, ''),
        directory,
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
  let result = true

  image.initProgress('converting', image.standby.size)

  /** Tauri側へ渡す値 */
  const fileData = [...image.standby.entries()]
    .map(([uuid, { path, baseName, directory = '' }]) => {
      const name = `${baseName}.${format}`
      return { uuid, path, name, directory }
    })

  // 進捗処理イベント
  const unlisten = await listen('progress', () => image.progress.count++)

  // 変換開始
  const reult = await invoke<ConvertedData[]>(
    'convert_images',
    { fileData, format, quality, output },
  ).catch((error) => {
    result = false

    // eslint-disable-next-line no-console
    if (error instanceof Error) console.error(error.message)

    // 変換成功したものだけ取得する
    return invoke<ConvertedData[]>('check_existing_files', { fileData, output })
  })

  unlisten()

  // データ整理
  for (const { uuid, path, fileSize } of reult) {
    const orig = image.standby.get(uuid)
    if (!orig) continue

    const dirPath = orig.directory ? orig.directory + '/' : ''

    image.complete.set(uuid, {
      path,
      fileName: `${dirPath}${orig.baseName}.${format}`,
      baseName: orig.baseName,
      mimeType: `image/${format}`,
      fileSrc: convertFileSrc(path),
      size: {
        before: orig.size.before,
        after: fileSize,
      },
    })

    image.standby.delete(uuid)
    image.progress.count++
  }

  await sleep(400)

  image.done()

  convertNotification(result)
}
