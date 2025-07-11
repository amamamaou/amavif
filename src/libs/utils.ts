import { h, type VNode } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'
import { t } from '@/i18n'
import { errorNoti } from '@/libs/feedback'

/** 画像選択ダイアログを開く */
export async function openDialog(): Promise<string[]> {
  const paths = await open({
    title: t('dialog.select'),
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
    title: t('dialog.output'),
    directory: true,
    defaultPath: defaultPath || undefined,
  })
  return path ?? ''
}

/** catchによるエラー判別 */
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  return 'Unknown Error'
}

/** 指定したパスを開く */
export async function openFileExplorer(path: string): Promise<void> {
  if (!path) return

  try {
    await invoke<void>('open_file_explorer', { path })
  } catch (error) {
    errorNoti(getErrorMessage(error))
  }
}

/** バイト数を変換 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 byte'

  const units = ['bytes', 'KB', 'MB', 'GB', 'TB']
  let i = Math.floor(Math.log(bytes) / Math.log(1024))
  let value = bytes / 1024 ** i

  if (value > 999) {
    value /= 1024
    i++
  }

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
