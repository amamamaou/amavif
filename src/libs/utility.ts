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
    filters: [
      {
        name: 'Image Files',
        extensions: ['jpg', 'jpeg', 'png', 'webp'],
      },
    ],
  })

  return paths ?? []
}

type FileInfoResult = { data: FileInfoMap } & FileLoadFlags

/** ファイル情報を取得する */
export async function getFileInfo(
  paths: string[],
  data: FileInfoMap,
): Promise<FileInfoResult> {
  const currentPaths = [...data.values()].map(item => item.path)
  let hasDuplicate = false
  let hasUnsupported = false

  for (const path of paths) {
    // 重複しているか
    if (currentPaths.includes(path)) {
      hasDuplicate = true
      continue
    }

    const mimeType = await invoke<string>('get_mime_type', { path })

    // 変換対象の画像形式か
    if (!isAllowInputMIMEType(mimeType)) {
      hasUnsupported = true
      continue
    }

    const uuid = crypto.randomUUID()
    const fileName = await basename(path)
    const baseName = fileName.replace(/\.\w+$/, '')
    const fileSize = await invoke<number>('get_file_size', { path })

    data.set(uuid, { path, fileName, baseName, mimeType, size: { before: fileSize, after: 0 } })
  }

  return { data, hasDuplicate, hasUnsupported }
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
