<script setup lang="ts">
import { ref } from 'vue'
import { listen } from '@tauri-apps/api/event'
import useImageStore from '@/store/image'

import MainLayout from '@/layout/MainLayout.vue'
import FooterControl from '@/components/FooterControl.vue'
import DropOverlay from '@/components/DropOverlay.vue'
import LoadingDialog from '@/components/LoadingDialog.vue'
import ProcessingDialog from '@/components/ProcessingDialog.vue'

const image = useImageStore()
const isDropEnter = ref<boolean>(false)

listen('tauri://drag-enter', () => {
  if (!image.isLoading && !image.isProcessing) {
    isDropEnter.value = true
  }
})

listen('tauri://drag-leave', () => {
  isDropEnter.value = false
})

listen('tauri://drag-drop', (event) => {
  if (!image.isLoading && !image.isProcessing) {
    const paths = (event.payload as { paths: string[] }).paths
    image.addItems(paths)
  }

  isDropEnter.value = false
})
</script>

<template>
  <el-container>
    <el-main>
      <MainLayout />
    </el-main>

    <el-footer>
      <FooterControl />
    </el-footer>
  </el-container>

  <!-- ドラッグ&ドロップ時のオーバーレイ -->
  <DropOverlay :is-drop-enter="isDropEnter" />

  <!-- 読込中ダイアログ -->
  <LoadingDialog />

  <!-- 処理中ダイアログ -->
  <ProcessingDialog />
</template>

<style scoped>
.el-container {
  height: 100dvh;
}

.el-main {
  padding: 0;
}

.el-footer {
  --el-footer-height: 96px;

  display: grid;
  align-items: center;
  border-top: 1px solid var(--el-border-color);
}
</style>
