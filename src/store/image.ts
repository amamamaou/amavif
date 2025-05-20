import { LazyStore } from '@tauri-apps/plugin-store'
import { defineStore } from 'pinia'
import { collectPaths, getFileInfo } from '@/libs/utility'
import notification from '@/libs/notification'

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

  actions: {
    /** 設定を読み込む */
    async loadSettings(): Promise<void> {
      const format = await store.get<ImageFormat>('fileFormat')
      const quality = await store.get<number>('quality')
      const output = await store.get<string>('outputDirectory')

      if (format) this.format = format
      if (quality) this.quality = quality
      if (output) this.output = output
    },

    /** 形式を保存する */
    async setFormat(format: ImageFormat): Promise<void> {
      this.format = format
      await store.set('format', format)
      await store.save()
    },

    /** クオリティを保存する */
    async setQuality(quality: number): Promise<void> {
      this.quality = quality
      await store.set('quality', quality)
      await store.save()
    },

    /** 出力先パスを保存する */
    async setOutput(output: string): Promise<void> {
      this.output = output
      await store.set('output', output)
      await store.save()
    },

    /** 画像を追加する */
    async addItems(paths: string[]): Promise<void> {
      if (paths.length === 0) return

      this.isLoading = true
      this.load.total = 0
      this.load.count = 0

      const currentPaths = [...this.standby.values()].map(item => item.path)
      const { data, flags } = await collectPaths(paths, currentPaths)

      this.load.total = data.length

      const fileInfo = await getFileInfo(data, () => this.load.count++)

      this.standby = new Map([...this.standby, ...fileInfo])
      this.isLoading = false

      notification(flags)
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
  },
})

export default useImageStore
