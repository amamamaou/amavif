import { convertFileSrc, invoke } from '@tauri-apps/api/core'
import { sleep } from '@/libs/utility'
import useImageStore from '@/store/image'

/** 変換データ */
type ConvertedData = [string, string][]

/** 画像を変換する */
export default async function convertImage(): Promise<boolean> {
  const image = useImageStore()
  let result = true

  image.isProcessing = true

  /** Tauri側へ渡す値 */
  const fileData = [...image.standby.entries()]
    .map(([uuid, { path, baseName, directory = '' }]) => {
      const file_name = `${baseName}.${image.format}`
      return { uuid, path, file_name, directory }
    })

  // 変換開始
  const converted = await invoke<ConvertedData>('convert_images', {
    fileData,
    format: image.format,
    quality: image.quality,
    output: image.output,
  }).catch((error) => {
    result = false

    // eslint-disable-next-line no-console
    if (error instanceof Error) console.error(error.message)

    // 変換成功したものだけ取得する
    return invoke<ConvertedData>('check_existing_files', {
      fileData,
      output: image.output,
    })
  })

  // データ整理
  for (const [uuid, path] of converted) {
    const orig = image.standby.get(uuid)
    if (!orig) continue

    const dirPath = orig.directory ? orig.directory + '/' : ''
    const afterSize = await invoke<number>('get_file_size', { path })

    image.complete.set(uuid, {
      path,
      fileName: `${dirPath}${orig.baseName}.${image.format}`,
      baseName: orig.baseName,
      mimeType: `image/${image.format}`,
      fileSrc: convertFileSrc(path),
      size: {
        before: orig.size.before,
        after: afterSize,
      },
    })

    image.standby.delete(uuid)
  }

  await sleep(400)

  image.isProcessing = false

  return result
}
