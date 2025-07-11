import { defineStore } from 'pinia'
import { LazyStore } from '@tauri-apps/plugin-store'
import { convertFileSrc, invoke } from '@tauri-apps/api/core'
import { once, listen } from '@tauri-apps/api/event'
import { getErrorMessage, sleep } from '@/libs/utils'
import { load, convert } from '@/libs/notification'

/** 処理ステータス */
type ProgressStatus = 'idle' | 'loading' | 'converting'

/** 画像変換プション */
interface ImageOptions {
  format: Amavif.Format;
  quality: number;
  output: string;
}

/** 処理中データ */
interface ProgressState {
  status: ProgressStatus;
  count: number;
  total: number;
}

/** 画像情報 */
interface ImageInfo {
  uuid: string;
  path: string;
  fileName: string,
  fileSize: number;
  mime: Amavif.MIMEType;
  dir: string[];
}

/** 変換データ */
interface ConvertedData {
  uuid: string,
  path: string,
  fileSize: number,
}

/** 設定ファイル */
const store = new LazyStore('settings.json')

/** 変換情報ストア */
export const useImageStore = defineStore('image', () => {
  // --- State ---
  /** 変換前データ */
  const standby = shallowRef<Amavif.InfoMap>(new Map())

  /** 変換後データ */
  const complete = shallowRef<Amavif.InfoMap>(new Map())

  /** 変換前データのバックアップ */
  const backup = shallowRef<Amavif.InfoMap>(new Map())

  /** 画像変換プション */
  const options = reactive<ImageOptions>({
    format: 'webp',
    quality: 80,
    output: '',
  })

  /** 進捗データ */
  const progress = reactive<ProgressState>({
    status: 'idle',
    count: 0,
    total: 0,
  })

  // --- Getters ---
  /** 変換が可能かどうか */
  const canConvert = computed(() => options.output !== '' && standby.value.size > 0)

  /** すべてのアイテムが空か */
  const isEmpty = computed(() => standby.value.size === 0 && complete.value.size === 0)

  /** 操作ができない状態か */
  const isLocked = computed(() => progress.status !== 'idle')

  // --- etc ---
  /** 処理ステート初期化 */
  function initProgress(status: ProgressStatus, total: number = 0) {
    progress.status = status
    progress.total = total
    progress.count = 0
  }

  /** マップのリセット */
  function resetMap(isRestore = false) {
    standby.value = new Map(isRestore ? [...backup.value, ...standby.value] : [])
    complete.value = new Map()
    backup.value = new Map()
  }

  /** データから値を削除して更新 */
  function mapDelete(infoMap: Ref<Amavif.InfoMap>, uuid: string) {
    const deleted = infoMap.value.delete(uuid)
    if (deleted) infoMap.value = new Map(infoMap.value)
  }

  return {
    // --- State ---
    standby, complete, backup, options, progress,

    // --- Getters ---
    canConvert, isEmpty, isLocked,

    // --- Actions ---
    /** 画像を追加する */
    async addImages(paths: string[]) {
      if (paths.length === 0) return

      initProgress('loading')

      // 進捗イベント
      const unlistenTotal = await once<number>('total', (event) => {
        progress.total = event.payload
      })
      const unlistenProgress = await listen('progress', () => progress.count++)

      try {
        // パスから画像情報を取得する
        const imageInfos = await invoke<ImageInfo[]>('get_image_info', { paths })

        if (imageInfos.length === 0) {
          load.empty()
          return
        }

        // 一時的な非リアクティブMapを作る
        const newStandby = new Map(standby.value)
        const newComplete = new Map(complete.value)

        // パスから画像情報を取得する
        for (const { uuid, path, fileName, fileSize, mime, dir } of imageInfos) {
          // 完了データに存在する場合は取り除く
          newComplete.delete(uuid)

          newStandby.set(uuid, {
            path,
            fileName: [...dir, fileName].join('/'),
            baseName: fileName.replace(/\.\w+$/, ''),
            dir,
            mime,
            fileSrc: convertFileSrc(path),
            size: { before: fileSize, after: 0 },
          })
        }

        standby.value = newStandby
        complete.value = newComplete

        await nextTick()
        await sleep(400)
      } catch (error) {
        load.failed(getErrorMessage(error))
      } finally {
        unlistenTotal()
        unlistenProgress()
        progress.status = 'idle'
      }
    },

    /** 画像を変換する */
    async convertImages() {
      if (standby.value.size === 0) return

      const { format, output } = options
      let errMsg = ''

      // 一時的な非リアクティブMapを作る
      const newStandby = new Map(standby.value)

      initProgress('converting', newStandby.size)

      /** Tauri側へ渡す値 */
      const fileData = [...newStandby.entries()]
        .map(([uuid, { path, baseName, dir }]) => {
          const fileName = `${baseName}.${format}`
          return { uuid, path, fileName, dir }
        })

      // 進捗処理イベント
      const unlisten = await listen('progress', () => progress.count++)

      // 変換開始
      const result = await invoke<ConvertedData[]>('convert_images', { fileData, options })
        .catch((error) => {
          errMsg = getErrorMessage(error)

          // 変換成功したものだけ取得する
          return invoke<ConvertedData[]>('check_existing_files', { fileData, output })
        })

      unlisten()

      // 一時的な非リアクティブMapを作る
      const newComplete = new Map(complete.value)
      const newBackup = new Map(backup.value)

      // データ整理
      for (const { uuid, path, fileSize } of result) {
        const orig = newStandby.get(uuid)
        if (!orig) continue

        newComplete.set(uuid, {
          path,
          fileName: [...orig.dir, `${orig.baseName}.${format}`].join('/'),
          baseName: orig.baseName,
          dir: orig.dir,
          mime: `image/${format}`,
          fileSrc: convertFileSrc(path),
          size: {
            before: orig.size.before,
            after: fileSize,
          },
        })
        newBackup.set(uuid, orig)
        newStandby.delete(uuid)
      }

      standby.value = newStandby
      complete.value = newComplete
      backup.value = newBackup

      await nextTick()
      await sleep(400)

      progress.status = 'idle'

      if (errMsg) {
        convert.failed(errMsg)
      } else if (result.length < fileData.length) {
        convert.partial()
      } else {
        convert.success()
      }
    },

    /** 設定を読み込む */
    async loadSettings() {
      const format = await store.get<Amavif.Format>('format')
      const quality = await store.get<number>('quality')
      const output = await store.get<string>('output')

      if (format) options.format = format
      if (quality) options.quality = quality
      if (output) options.output = output
    },

    /** 画像をリストから取り除く */
    removeItem(uuid: string) {
      mapDelete(standby, uuid)
      mapDelete(complete, uuid)
      mapDelete(backup, uuid)
    },

    /** すべての画像を取り除く */
    removeItems() {
      resetMap()
    },

    /** 変換をやり直す */
    restore() {
      resetMap(true)
    },

    /** 形式を保存する */
    async setFormat(format: Amavif.Format) {
      options.format = format
      await store.set('format', format)
    },

    /** 出力先パスを保存する */
    async setOutput(output: string) {
      options.output = output
      await store.set('output', output)
    },

    /** クオリティを保存する */
    async setQuality(quality: number) {
      options.quality = quality
      await store.set('quality', quality)
    },
  }
})

export default useImageStore
