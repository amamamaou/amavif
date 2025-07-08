import { defineStore } from 'pinia'
import { LazyStore } from '@tauri-apps/plugin-store'
import { addImages, convertImages } from '@/libs/image-service'

/** 処理ステート */
export type ProcessingStatus = 'idle' | 'loading' | 'converting'

/** 画像ストアステート */
export interface ImagesState {
  standby: Amavif.InfoMap;
  complete: Amavif.InfoMap;
  backup: Amavif.InfoMap;
  format: Amavif.Format;
  quality: number;
  output: string;
  status: ProcessingStatus;
  progress: {
    count: number;
    total: number;
  };
}

/** 設定ファイルStore */
const store = new LazyStore('settings.json')

/** 変換情報ストア */
const useImageStore = defineStore('image', {
  state: (): ImagesState => ({
    standby: new Map(),
    complete: new Map(),
    backup: new Map(),
    format: 'webp',
    quality: 80,
    output: '',
    status: 'idle',
    progress: { count: 0, total: 0 },
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
      return state.status !== 'idle'
    },

    /** 変換前のトータルファイルサイズ */
    standbySize(state): number {
      let total = 0
      for (const { size } of state.standby.values()) {
        total += size.before
      }
      return total
    },

    /** 変換後のトータルファイルサイズデータ */
    convertedSize(state): Amavif.FileSize {
      let before = 0
      let after = 0
      for (const { size } of state.complete.values()) {
        before += size.before
        after += size.after
      }
      return { before, after }
    },
  },

  actions: {
    /** 画像を追加する */
    addImages,

    /** 画像を変換する */
    convertImages,

    /** 処理完了 */
    done(): void {
      this.status = 'idle'
    },

    /** 処理ステート初期化 */
    initProgress(status: ProcessingStatus, total: number = 0): void {
      this.status = status
      this.progress.total = total
      this.progress.count = 0
    },

    /** 設定を読み込む */
    async loadSettings(): Promise<void> {
      const format = await store.get<Amavif.Format>('format')
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
      this.backup.delete(uuid)
    },

    /** すべての画像を取り除く */
    removeItems(): void {
      this.standby.clear()
      this.complete.clear()
      this.backup.clear()
    },

    /** 変換をやり直す */
    restore(): void {
      this.standby = new Map([...this.backup, ...this.standby])
      this.complete.clear()
      this.backup.clear()
    },

    /** 形式を保存する */
    async setFormat(format: Amavif.Format): Promise<void> {
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
