import { convertFileSrc, invoke } from '@tauri-apps/api/core'
import { basename } from '@tauri-apps/api/path'
import { isAllowInputMIMEType, sleep } from '@/libs/utils'
import { convertNotification, loadNotification } from '@/libs/notification'
import useImageStore from '@/store/image'

/** 変換データ */
type ConvertedData = [string, string][]

/** 整えられたパスデータ */
interface CollectedPathData {
  path: string;
  directory?: string;
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
      pathData.push({ path, directory })
    }
  }

  return { pathData, hasSubDir }
}

/** 画像ファイルを追加する */
export async function addImages(paths: string[]): Promise<void> {
  if (paths.length === 0) return

  const image = useImageStore()
  image.isLoading = true
  image.load.total = 0
  image.load.count = 0

  // ディレクトリが含まれる場合があるので先に整える
  const { pathData, hasSubDir } = await collectPaths(paths)
  image.load.total = pathData.length

  /** 現在待機中の画像パス */
  const standbyPaths = [...image.standby.values()].map(item => item.path)

  /** 通知フラグ */
  const flags: FileLoadFlags = {
    directory: hasSubDir,
    duplicate: false,
    unsupported: false,
  }

  // パスから画像情報を取得する
  for (const { path, directory } of pathData) {
    // 重複しているか
    if (standbyPaths.includes(path)) {
      flags.duplicate = true
      image.load.count++
      continue
    }

    // MIMEタイプ取得
    const mimeType = await invoke<string>('get_mime_type', { path })

    // 変換対象の画像形式か確認
    if (isAllowInputMIMEType(mimeType)) {
      const uuid = crypto.randomUUID()
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

    image.load.count++
  }

  image.isLoading = false

  loadNotification(flags)
}

/** 画像を変換する */
export async function convertImages(): Promise<void> {
  const image = useImageStore()
  const { format, quality, output } = image
  let result = true

  image.isProcessing = true

  /** Tauri側へ渡す値 */
  const fileData = [...image.standby.entries()]
    .map(([uuid, { path, baseName, directory = '' }]) => {
      const file_name = `${baseName}.${format}`
      return { uuid, path, file_name, directory }
    })

  // 変換開始
  const converted = await invoke<ConvertedData>(
    'convert_images',
    { fileData, format, quality, output },
  ).catch((error) => {
    result = false

    // eslint-disable-next-line no-console
    if (error instanceof Error) console.error(error.message)

    // 変換成功したものだけ取得する
    return invoke<ConvertedData>('check_existing_files', { fileData, output })
  })

  // データ整理
  for (const [uuid, path] of converted) {
    const orig = image.standby.get(uuid)
    if (!orig) continue

    const dirPath = orig.directory ? orig.directory + '/' : ''
    const afterSize = await invoke<number>('get_file_size', { path })

    image.complete.set(uuid, {
      path,
      fileName: `${dirPath}${orig.baseName}.${format}`,
      baseName: orig.baseName,
      mimeType: `image/${format}`,
      fileSrc: convertFileSrc(path),
      size: {
        before: orig.size.before,
        after: afterSize,
      },
    })

    image.standby.delete(uuid)
  }

  await sleep(400)

  image.isProcessing = false

  convertNotification(result)
}
