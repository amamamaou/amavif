import { invoke } from '@tauri-apps/api/core'
import { type Store } from 'pinia'
import { sleep } from '@/libs/utility'

/** 画像を変換する */
export default async function convertImage(
  image: Store<'image', ImagesStore>,
): Promise<boolean> {
  image.isProcessing = true

  /** Tauri側へ渡す値 */
  const fileData = [...image.standby.entries()].map(([uuid, item]) => {
    return { uuid, path: item.path, file_name: item.baseName }
  })

  // 変換開始
  const result = await invoke<[string, string][]>('convert_images', {
    fileData,
    format: image.format,
    quality: image.quality,
    output: image.output,
  }).catch((error) => {
    // eslint-disable-next-line no-console
    if (error instanceof Error) console.error(error.message)
    return null
  })

  if (result === null) return false

  // 変換後のデータ整理
  for (const [uuid, path] of result) {
    const orig = image.standby.get(uuid)
    if (!orig) continue

    const afterSize = await invoke<number>('get_file_size', { path })

    image.complete.set(uuid, {
      path,
      fileName: `${orig.baseName}.${image.format}`,
      baseName: orig.baseName,
      mimeType: `image/${image.format}`,
      size: {
        before: orig.size.before,
        after: afterSize,
      },
    })
  }

  // 変換対象リストを空にする
  image.standby.clear()

  await sleep(500)

  image.isProcessing = false

  return true
}
