import { h, type VNode } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'

/** 許可するMIMEタイプ */
const allowInputMIMEType: AllowInputMIMEType[] = ['image/jpeg', 'image/png', 'image/webp']

/** 許可するMIMEタイプかどうか */
export function isAllowInputMIMEType(mime: string): mime is AllowInputMIMEType {
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
