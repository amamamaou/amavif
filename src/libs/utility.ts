import { h, type VNode } from 'vue'
import { convertFileSrc, invoke } from '@tauri-apps/api/core'
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

/** 整えられたパスデータ */
interface CollectedPathData {
  path: string;
  directory?: string;
}

/** ディレクトリが含まれるパスを整える */
export async function collectPaths(
  paths: string[],
  directory?: string,
): Promise<{
  data: CollectedPathData[];
  hasSubDir: boolean;
}> {
  const data: CollectedPathData[] = []
  let hasSubDir = false

  for (const path of paths) {
    const isDirectory = await invoke<boolean>('is_directory', { path })

    // ディレクトリかどうか
    if (isDirectory) {
      if (directory) {
        // 再帰的処理は行わない
        hasSubDir = true
      } else {
        // 直下の画像ファイルを取得する
        const newPaths = await invoke<string[]>('get_image_files_in_dir', { path })
        const dirName = await basename(path)
        const children = await collectPaths(newPaths, dirName)

        if (children.hasSubDir) hasSubDir = true

        data.push(...children.data)
      }

      continue
    } else {
      data.push({ path, directory })
    }
  }

  return { data, hasSubDir }
}

/** ファイル情報を取得する */
export async function getFileInfo(
  data: CollectedPathData[],
  currentPaths: string[],
  onContinue: () => void,
): Promise<{
  fileInfo: FileInfoMap;
  flags: Omit<FileLoadFlags, 'directory'>;
}> {
  const fileInfo: FileInfoMap = new Map()
  const flags: Omit<FileLoadFlags, 'directory'> = {
    duplicate: false,
    unsupported: false,
  }

  for (const { path, directory } of data) {
    // 重複しているか
    if (currentPaths.includes(path)) {
      flags.duplicate = true
      onContinue()
      continue
    }

    // MIMEタイプ取得
    const mimeType = await invoke<string>('get_mime_type', { path })

    // 変換対象の画像形式か確認
    if (isAllowInputMIMEType(mimeType)) {
      const uuid = crypto.randomUUID()
      const fileName = await basename(path)
      const fileSize = await invoke<number>('get_file_size', { path })

      fileInfo.set(uuid, {
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

    onContinue()
  }

  return { fileInfo, flags }
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

/** mdiアイコンをsvgのVNodeにする */
export function svgRender(path: string): VNode {
  return h('svg', { viewBox: '0 0 24 24' }, [
    h('path', { d: path, fill: 'currentcolor' }),
  ])
}
