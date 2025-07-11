import { t } from '@/i18n'

/** 画像が多い場合の確認 */
export async function confirm(total: number): Promise<boolean> {
  try {
    await ElMessageBox.confirm(
      t('confirm.message', { total: total.toLocaleString() }),
      t('confirm.title'),
      {
        type: 'warning',
        center: true,
        cancelButtonText: t('confirm.cancel'),
      },
    )
    return true
  } catch {
    return false
  }
}

/** ロード系 */
export const load = {
  /** 画像読み込みエラー */
  failed(msg: string): void {
    ElNotification.error({
      title: t('noti.load.title'),
      message: t('noti.load.message', { msg }),
    })
  },

  /** 0件だった時 */
  empty(): void {
    ElNotification.info({
      title: t('noti.empty.title'),
      message: t('noti.empty.message'),
    })
  },

  /** 画像が数件スキップされた場合 */
  skip(total: number): void {
    ElNotification.info({
      title: t('noti.skip.title'),
      message: t('noti.skip.message', { total: total.toLocaleString() }),
    })
  },
} as const

/** 変換系 */
export const convert = {
  /** 変換成功 */
  success(): void {
    ElNotification.success({
      title: t('noti.success.title'),
      message: t('noti.success.message'),
    })
  },

  /** 一部変換失敗 */
  partial(): void {
    ElNotification.warning({
      title: t('noti.partial.title'),
      message: t('noti.partial.message'),
    })
  },

  /** 変換失敗 */
  failed(msg: string): void {
    ElNotification.error({
      title: t('noti.failed.title'),
      message: t('noti.failed.message', { msg }),
    })
  },
} as const

/** 汎用エラー */
export function errorNoti(message: string): void {
  ElNotification.error({ title: 'Error', message })
}
