import { ElNotification } from 'element-plus'
import { sleep } from '@/libs/utils'

/** 変換結果の通知 */
export function convertNotification(result: boolean): void {
  if (result) {
    ElNotification({
      title: 'Completed',
      message: 'All done! Your images are ready.',
      type: 'success',
    })
  } else {
    ElNotification({
      title: 'Failed',
      message: 'Oops! Couldn’t convert the images.',
      type: 'error',
    })
  }
}

/** ファイル読み込み時の通知処理 */
export async function loadNotification(flags: FileLoadFlags): Promise<void> {
  // 重複したとき
  if (flags.duplicate) {
    ElNotification({
      title: 'Duplicate Images Found',
      message: 'Looks like those images were already in the list!',
      type: 'info',
    })

    await sleep(10)
  }

  // 複数回層のディレクトリが見つかったとき
  if (flags.directory) {
    ElNotification({
      title: 'Too Many Folder Levels',
      message: 'Image loading only works one level deep in folders. This one was skipped.',
      type: 'info',
    })

    await sleep(10)
  }

  // サポートしないファイル
  if (flags.unsupported) {
    ElNotification({
      title: 'Unsupported Images Found',
      message: 'Some images weren’t added because their format isn’t supported.',
      type: 'warning',
    })
  }
}
