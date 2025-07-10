import { t } from '@/i18n'

const notification = {
  load: {
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
  },

  convert: {
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
  },

  /** 汎用エラー */
  error(message: string): void {
    ElNotification.error({ title: 'Error', message })
  },
} as const

export default notification
