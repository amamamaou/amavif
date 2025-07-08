<script setup lang="ts">
import { listen } from '@tauri-apps/api/event'

import MainLayout from '@/layout/MainLayout.vue'
import FooterControl from '@/components/FooterControl.vue'
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

listen('tauri://drag-drop', (event) => {
  if (!image.isLocked) {
    const paths = (event.payload as { paths: string[] }).paths
    image.addImages(paths)
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

  <!-- 処理ダイアログ -->
  <ProgressDialog />
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

  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px solid var(--el-border-color);
}
</style>
