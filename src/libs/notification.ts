import { ElNotification } from 'element-plus'

/** ファイル読み込み時の通知処理 */
export default function notification(flags: FileLoadFlags): void {
  const { hasDuplicate, hasUnsupported } = flags

  // 重複したとき
  if (hasDuplicate) {
    ElNotification({
      title: 'Duplicate Images Found',
      message: 'Looks like those images were already in the list!',
      type: 'info',
    })
  }

  // サポートしないファイル
  if (hasUnsupported) {
    ElNotification({
      title: 'Unsupported Images Found',
      message: 'Some images weren’t added because their format isn’t supported.',
      type: 'warning',
    })
  }
}
