import { sleep } from '@/libs/utils'

/** 変換結果の通知 */
export function convertNotification(result: boolean): void {
  if (result) {
    ElNotification.success({
      title: 'Completed',
      message: 'All done! Your images are ready.',
    })
  } else {
    ElNotification.error({
      title: 'Failed',
      message: 'Oops! Couldn’t convert the images.',
    })
  }
}

/** ファイル読み込み時の通知処理 */
export async function loadNotification(flags: FileLoadFlags): Promise<void> {
  // 重複したとき
  if (flags.duplicate) {
    ElNotification.info({
      title: 'Duplicate Images Found',
      message: 'Looks like those images were already in the list!',
    })

    await sleep(10)
  }

  // 複数回層のディレクトリが見つかったとき
  if (flags.directory) {
    ElNotification.info({
      title: 'Too Many Folder Levels',
      message: 'Image loading only works one level deep in folders. This one was skipped.',
    })

    await sleep(10)
  }

  // サポートしないファイル
  if (flags.unsupported) {
    ElNotification.warning({
      title: 'Unsupported Images Found',
      message: 'Some images weren’t added because their format isn’t supported.',
    })
  }
}
