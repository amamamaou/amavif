import { invoke } from '@tauri-apps/api/core'
import { sleep } from '@/libs/utility'
import useImageStore from '@/store/image'

type ConvertedData = [string, string][]

/** 変換後のデータ整理 */
async function setConverted(
  data: ConvertedData,
  removeItem: boolean = false,
): Promise<void> {
  const image = useImageStore()

  for (const [uuid, path] of data) {
    const orig = image.standby.get(uuid)
    if (!orig) continue

    const dirPath = orig.directory ? orig.directory + '/' : ''
    const afterSize = await invoke<number>('get_file_size', { path })

    image.complete.set(uuid, {
      path,
      fileName: `${dirPath}${orig.baseName}.${image.format}`,
      baseName: orig.baseName,
      mimeType: `image/${image.format}`,
      size: {
        before: orig.size.before,
        after: afterSize,
      },
    })

    if (removeItem) image.standby.delete(uuid)
  }
}

/** 画像を変換する */
export default async function convertImage(): Promise<boolean> {
  const image = useImageStore()

  image.isProcessing = true

  /** Tauri側へ渡す値 */
  const fileData = [...image.standby.entries()]
    .map(([uuid, { path, baseName, directory = '' }]) => {
      const file_name = `${baseName}.${image.format}`
      return { uuid, path, file_name, directory }
    })

  // 変換開始
  const result = await invoke<ConvertedData>('convert_images', {
    fileData,
    format: image.format,
    quality: image.quality,
    output: image.output,
  }).catch((error) => {
    // eslint-disable-next-line no-console
    if (error instanceof Error) console.error(error.message)
    return null
  })

  // 変換中にエラーが出た場合
  if (result === null || result.length < fileData.length) {
    const existFiles = await invoke<ConvertedData>('check_existing_files', {
      fileData,
      output: image.output,
    })

    await setConverted(existFiles, true)
    await sleep(400)

    image.isProcessing = false

    return false
  }

  // 変換後のデータ整理
  await setConverted(result)

  // 変換対象リストを空にする
  image.standby.clear()

  await sleep(400)

  image.isProcessing = false

  return true
}
