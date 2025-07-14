import { h, type VNode } from 'vue'

/** catchによるエラー判別 */
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  return 'Unknown Error'
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
