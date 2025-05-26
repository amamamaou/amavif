import { defineStore } from 'pinia'
import { LazyStore } from '@tauri-apps/plugin-store'
import { addImages, convertImages } from '@/libs/image-service'

/** 設定ファイルStore */
const store = new LazyStore('settings.json')

/** 変換情報ストア */
const useImageStore = defineStore('image', {
  state: (): ImagesStore => ({
    standby: new Map(),
    complete: new Map(),
    format: 'webp',
    quality: 80,
    output: '',
    isProcessing: false,
    isLoading: false,
    load: { total: 0, count: 0 },
  }),

  getters: {
    /** 変換が可能かどうか */
    canConvert(state): boolean {
      return state.output !== '' && state.standby.size > 0
    },

    /** すべてのアイテムが空か */
    isEmpty(state): boolean {
      return state.standby.size === 0 && state.complete.size === 0
    },

    /** 操作ができない状態か */
    isLocked(state): boolean {
      return state.isLoading || state.isProcessing
    },

    /** 変換前のトータルファイルサイズ */
    standbySize(state): number {
      let total = 0
      for (const { size: { before } } of state.standby.values()) {
        total += before
      }
      return total
    },

    /** 変換後のトータルファイルサイズデータ */
    convertedSize(state): FileSizeData {
      const data: FileSizeData = { before: 0, after: 0 }
      for (const { size: { before, after } } of state.complete.values()) {
        data.before += before
        data.after += after
      }
      return data
    },
  },

  actions: {
    /** 画像を追加する */
    async addImages(paths: string[]): Promise<void> {
      await addImages(paths)
    },

    /** 変換する */
    async convert(): Promise<void> {
      await convertImages()
    },

    /** 設定を読み込む */
    async loadSettings(): Promise<void> {
      const format = await store.get<ImageFormat>('format')
      const quality = await store.get<number>('quality')
      const output = await store.get<string>('output')

      if (format) this.format = format
      if (quality) this.quality = quality
      if (output) this.output = output
    },

    /** 画像をリストから取り除く */
    removeItem(uuid: string): void {
      this.standby.delete(uuid)
      this.complete.delete(uuid)
    },

    /** すべての画像を取り除く */
    removeItems(): void {
      this.standby.clear()
      this.complete.clear()
    },

    /** 形式を保存する */
    async setFormat(format: ImageFormat): Promise<void> {
      this.format = format
      await store.set('format', format)
    },

    /** 出力先パスを保存する */
    async setOutput(output: string): Promise<void> {
      // 出力先パスが変更された場合、変換済み一覧は消す
      if (output !== this.output) this.complete.clear()

      this.output = output
      await store.set('output', output)
    },

    /** クオリティを保存する */
    async setQuality(quality: number): Promise<void> {
      this.quality = quality
      await store.set('quality', quality)
    },
  },
})

export default useImageStore
