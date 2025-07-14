import { defineStore } from 'pinia'
import { load } from '@tauri-apps/plugin-store'
import { convertFileSrc, invoke } from '@tauri-apps/api/core'
import { once, listen } from '@tauri-apps/api/event'
import { open } from '@tauri-apps/plugin-dialog'
import { t } from '@/i18n'
import { getErrorMessage, sleep } from '@/libs/utils'
import { confirm, LoadNoti, ConvertNoti, errorNoti } from '@/libs/feedback'

/** 確認を出す画像数のしきい値 */
const IMAGE_CONFIRM_THRESHOLD = 500

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
      const unlisten = await listen('progress', () => progress.count++)

      try {
        // パスから画像情報を取得する
        const imageInfos = await invoke<Amavif.ImageInfo[]>('get_image_info', { paths })
        const imageTotal = imageInfos.length

        if (imageTotal === 0) {
          LoadNoti.empty()
          return
        }

        // 数が多い場合は確認する
        if (imageTotal > IMAGE_CONFIRM_THRESHOLD) {
          if (!await confirm(imageTotal)) return
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

        // 数が合わないときは通知する
        if (progress.total > imageTotal) {
          LoadNoti.skip(progress.total - imageTotal)
        }
      } catch (error) {
        LoadNoti.failed(getErrorMessage(error))
      } finally {
        unlistenTotal()
        unlisten()
        progress.status = 'idle'
      }
    },

    /** 画像を変換する */
    async convertImages() {
      const standbySize = standby.value.size

      if (standbySize === 0) return

      // 数が多い場合は確認する
      if (standbySize > IMAGE_CONFIRM_THRESHOLD) {
        if (!await confirm(standbySize)) return
      }

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
      const result = await invoke<Amavif.ConvertedData[]>('convert_images', { fileData, options })
        .catch((error) => {
          errMsg = getErrorMessage(error)

          // 変換成功したものだけ取得する
          return invoke<Amavif.ConvertedData[]>('check_existing_files', { fileData, output })
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
        ConvertNoti.failed(errMsg)
      } else if (result.length < fileData.length) {
        ConvertNoti.partial()
      } else {
        ConvertNoti.success()
      }
    },

    /** 設定を読み込む */
    async loadSettings() {
      const store = await load('settings.json')
      const format = await store.get<Amavif.Format>('format')
      const quality = await store.get<number>('quality')
      const output = await store.get<string>('output')

      if (format) options.format = format
      if (quality) options.quality = quality
      if (output) options.output = output

      // 変更を監視する
      watchEffect(() => store.set('format', options.format))
      watchEffect(() => store.set('quality', options.quality))
      watchEffect(() => store.set('output', options.output))
    },

    /** 画像選択ダイアログを開く */
    async openDialog() {
      const paths = await open({
        title: t('dialog.select'),
        multiple: true,
        directory: false,
        canCreateDirectories: false,
        filters: [
          {
            name: 'Image Files',
            extensions: ['jpg', 'jpeg', 'png', 'webp'],
          },
        ],
      })
      if (paths) this.addImages(paths)
    },

    /** 出力先を エクスプローラー/Finder で開く */
    async openOutput() {
      if (!options.output) return
      try {
        await invoke<void>('open_file_explorer', { path: options.output })
      } catch (error) {
        errorNoti(getErrorMessage(error))
      }
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

    /** 出力先選択ダイアログを開き出力先パスを保存する */
    async selectOutput() {
      const path = await open({
        title: t('dialog.output'),
        directory: true,
        defaultPath: options.output || undefined,
      })
      options.output = path ?? ''
    },
  }
})

export default useImageStore
