<script setup lang="ts">
import { listen } from '@tauri-apps/api/event'

import MainLayout from '@/layout/MainLayout.vue'
import DropOverlay from '@/components/DropOverlay.vue'
import ProgressDialog from '@/components/ProgressDialog.vue'

const image = useImageStore()
const isDropEnter = ref<boolean>(false)

listen('tauri://drag-enter', () => {
  if (!image.isLocked) {
    isDropEnter.value = true
  }
})

listen('tauri://drag-leave', () => {
  isDropEnter.value = false
})

listen<{ paths: string[] }>('tauri://drag-drop', (event) => {
  if (!image.isLocked) {
    image.addImages(event.payload.paths)
  }

  isDropEnter.value = false
})
</script>

<template>
  <!-- メインレウアウト -->
  <MainLayout />

  <!-- ドラッグ&ドロップ時のオーバーレイ -->
  <DropOverlay :is-drop-enter="isDropEnter" />

  <!-- 処理ダイアログ -->
  <ProgressDialog />
</template>
