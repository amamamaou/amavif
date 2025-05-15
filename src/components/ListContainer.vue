<script setup lang="ts">
import { openDialog } from '@/libs/utility'
import useImageStore from '@/store/image'

import ImageList from '@/components/ImageList.vue'

import {
  mdiFileImagePlus,
  mdiTrashCanOutline,
} from '@mdi/js'
import svgRender from '@/render/svg-render'

const TrashIcon = svgRender(mdiTrashCanOutline)
const image = useImageStore()

/** ダイアログを開いてファイル追加する */
async function addItems() {
  const paths = await openDialog()
  image.addItems(paths)
}
</script>

<template>
  <div class="container">
    <div class="list-header">
      <el-button
        type="primary"
        :icon="svgRender(mdiFileImagePlus)"
        color="var(--color-primary)"
        :disabled="image.isProcessing"
        @click="addItems"
      >
        Add Images
      </el-button>

      <el-button
        type="danger"
        :icon="TrashIcon"
        :disabled="image.isProcessing"
        @click="image.removeItems"
      >
        Remove All
      </el-button>
    </div>

    <el-scrollbar class="list-wrapper">
      <ImageList :data="image.standby" />
      <ImageList :data="image.complete" :is-complete="true" />
    </el-scrollbar>
  </div>
</template>

<style scoped>
.container {
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100%;
}

.list-header {
  padding: 12px 20px;
  background-color: #fff;
  border-bottom: 1px solid var(--el-border-color);

  .el-button {
    font-weight: 700;

    :deep(.el-icon) {
      font-size: 1.2em;
    }
  }
}

.list-wrapper {
  min-height: 0;
}
</style>
