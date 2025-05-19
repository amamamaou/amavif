import { defineStore } from 'pinia'
import { collectPaths, getFileInfo } from '@/libs/utility'
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
      if (paths.length === 0) return

      this.isLoading = true
      this.load.total = 0
      this.load.count = 0

      const currentPaths = [...this.standby.values()].map(item => item.path)
      const { data, flags } = await collectPaths(paths, currentPaths)

      this.load.total = data.length

      const fileInfo = await getFileInfo(data, () => {
        this.load.count++
      })

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
