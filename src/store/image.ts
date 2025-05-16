import { defineStore } from 'pinia'
import { getFileInfo } from '@/libs/utility'
import notification from '@/libs/notification'

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
    /** 画像を追加する */
    async addItems(paths: string[]): Promise<void> {
      this.isLoading = true
      this.load.total = paths.length
      this.load.count = 0

      const { data, ...flags } = await getFileInfo(paths, this.standby, () => this.load.count++)

      this.standby = data
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
