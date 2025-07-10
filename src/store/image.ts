import { defineStore } from 'pinia'
import { LazyStore } from '@tauri-apps/plugin-store'
import { addImages, convertImages } from '@/libs/image-service'

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

/** 設定ファイルStore */
const store = new LazyStore('settings.json')

/** 変換情報ストア */
export const useImageStore = defineStore('image', () => {
  // --- State ---
  /** 変換前データ */
  const standby = ref<Amavif.InfoMap>(new Map())

  /** 変換後データ */
  const complete = ref<Amavif.InfoMap>(new Map())

  /** 変換前データのバックアップ */
  const backup = ref<Amavif.InfoMap>(new Map())

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

  return {
    // --- State ---
    standby, complete, backup, options, progress,

    // --- Getters ---
    /** 変換が可能かどうか */
    canConvert: computed(() => options.output !== '' && standby.value.size > 0),

    /** すべてのアイテムが空か */
    isEmpty: computed(() => standby.value.size === 0 && complete.value.size === 0),

    /** 操作ができない状態か */
    isLocked: computed(() => progress.status !== 'idle'),

    /** 変換前のトータルファイルサイズ */
    standbySize: computed<number>(() => {
      let total = 0
      for (const { size } of standby.value.values()) {
        total += size.before
      }
      return total
    }),

    /** 変換後のトータルファイルサイズデータ */
    convertedSize: computed<Amavif.FileSize>(() => {
      let before = 0
      let after = 0
      for (const { size } of complete.value.values()) {
        before += size.before
        after += size.after
      }
      return { before, after }
    }),

    // --- Actions ---
    /** 画像を追加する */
    addImages,

    /** 画像を変換する */
    convertImages,

    /** 処理完了 */
    done() {
      progress.status = 'idle'
    },

    /** 処理ステート初期化 */
    initProgress(status: ProgressStatus, total: number = 0) {
      progress.status = status
      progress.total = total
      progress.count = 0
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
      standby.value.delete(uuid)
      complete.value.delete(uuid)
      backup.value.delete(uuid)
    },

    /** すべての画像を取り除く */
    removeItems() {
      standby.value = new Map()
      complete.value = new Map()
      backup.value = new Map()
    },

    /** 変換をやり直す */
    restore() {
      standby.value = new Map([...backup.value, ...standby.value])
      complete.value = new Map()
      backup.value = new Map()
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
