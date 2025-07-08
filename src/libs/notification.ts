import { t } from '@/i18n'
import { sleep } from '@/libs/utils'

/** 画像ファイル読み込み時のお知らせフラグ */
export interface FileLoadFlags {
  empty?: boolean;
  duplicate?: boolean;
  unsupported?: boolean;
}

/** 変換結果の通知 */
export function convertNotification(result: boolean): void {
  if (result) {
    ElNotification.success({
      title: t('noti.success.title'),
      message: t('noti.success.message'),
    })
  } else {
    ElNotification.error({
      title: t('noti.failed.title'),
      message: t('noti.failed.message'),
    })
  }
}

/** ファイル読み込み時の通知処理 */
export async function loadNotification(flags: FileLoadFlags): Promise<void> {
  // 重複したとき
  if (flags.duplicate) {
    ElNotification.info({
      title: t('noti.duplicate.title'),
      message: t('noti.duplicate.message'),
    })

    await sleep(10)
  }

  // サポートしないファイル
  if (flags.unsupported) {
    ElNotification.warning({
      title: t('noti.unsupported.title'),
      message: t('noti.unsupported.message'),
    })

    await sleep(10)
  }

  // 結果的に0件だった場合
  if (flags.empty) {
    ElNotification.info({
      title: t('noti.empty.title'),
      message: t('noti.empty.message'),
    })
  }
}
