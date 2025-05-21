import { invoke } from '@tauri-apps/api/core'
import { basename } from '@tauri-apps/api/path'
import { open } from '@tauri-apps/plugin-dialog'

/** 許可するMIMEタイプ */
const allowInputMIMEType: AllowInputMIMEType[] = ['image/jpeg', 'image/png', 'image/webp']

/** 許可するMIMEタイプかどうか */
function isAllowInputMIMEType(mime: string): mime is AllowInputMIMEType {
  return allowInputMIMEType.some(v => v === mime)
}

/** 画像選択ダイアログを開く */
export async function openDialog(): Promise<string[]> {
  const paths = await open({
    title: 'Select Files',
    multiple: true,
    directory: false,
    canCreateDirectories: false,
    filters: [
      {
        name: 'Image Files',
        extensions: ['jpg', 'jpeg', 'png', 'webp'],
      },
    ],
  })
  return paths ?? []
}

/** 出力先選択ダイアログを開く */
export async function selectDialog(defaultPath: string): Promise<string> {
  const path = await open({
    title: 'Select Output',
    directory: true,
    defaultPath: defaultPath || undefined,
  })
  return path ?? ''
}

/** 指定したパスを開く */
export async function openFileExplorer(path: string): Promise<void> {
  return invoke<void>('open_file_explorer', { path })
}

/** 整えられたデータ */
interface CollectedImageData {
  path: string;
  mimeType: ImageMIMEType;
  directory: string;
}

/** パスから情報を取得し整える */
export async function collectPaths(
  paths: string[],
  currentPaths: string[],
  directory: string = '',
): Promise<{
  data: CollectedImageData[];
  flags: FileLoadFlags;
}> {
  const flags: FileLoadFlags = {
    duplicate: false,
    directory: false,
    unsupported: false,
  }
  const data: CollectedImageData[] = []

  for (const path of paths) {
    // 重複しているか
    if (currentPaths.includes(path)) {
      flags.duplicate = true
      continue
    }

    // MIMEタイプ取得
    const mimeType = await invoke<string>('get_mime_type', { path })

    // 渡されたパスがディレクトリの場合は直下の画像ファイルを取得する
    if (mimeType === 'directory') {
      if (directory !== '') {
        // 再帰的処理は行わない
        flags.directory = true
      } else {
        const newPaths = await invoke<string[]>('get_image_files_in_dir', { path })
        const dirName = await basename(path)
        const { data: nestData, flags: nestFlags } = await collectPaths(newPaths, currentPaths, dirName)

        if (nestFlags.duplicate) flags.duplicate = true
        if (nestFlags.directory) flags.directory = true
        if (nestFlags.unsupported) flags.unsupported = true

        data.push(...nestData)
      }

      continue
    }

    // 変換対象の画像形式か
    if (!isAllowInputMIMEType(mimeType)) {
      flags.unsupported = true
      continue
    }

    data.push({ path, mimeType, directory })
  }

  return { data, flags }
}

/** ファイル情報を取得する */
export async function getFileInfo(
  data: CollectedImageData[],
  onContinue: () => void,
): Promise<FileInfoMap> {
  const fileInfoMap: FileInfoMap = new Map()

  for (const { path, mimeType, directory } of data) {
    const uuid = crypto.randomUUID()
    const fileName = await basename(path)
    const fileSize = await invoke<number>('get_file_size', { path })
    const dirPath = directory !== '' ? directory + '/' : ''

    fileInfoMap.set(uuid, {
      path,
      fileName: dirPath + fileName,
      baseName: fileName.replace(/\.\w+$/, ''),
      directory,
      mimeType,
      size: { before: fileSize, after: 0 },
    })
    onContinue()
  }

  return fileInfoMap
}

/** バイト数を変換 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 byte'
  const units = ['bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / 1024 ** i
  return `${value.toFixed(Math.min(i, 2))} ${units[i]}`
}

/** 形式名を取得する */
export function getFormatName(type: string): string {
  const format = type.replace('image/', '')
  if (format === 'webp') return 'WebP'
  return format.toUpperCase()
}

/** sleep関数 */
export function sleep(time: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, time))
}
