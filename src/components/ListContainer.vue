<script setup lang="ts">
import { openDialog, openFileExplorer } from '@/libs/utility'
import useImageStore from '@/store/image'

import ImageList from '@/components/ImageList.vue'
import { ElNotification } from 'element-plus'

import {
  mdiFileImagePlus,
  mdiFolderOpen,
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

/** 出力先を開く */
function openOutputFolder() {
  if (image.output) {
    openFileExplorer(image.output).catch((error) => {
      if (typeof error == 'string') {
        ElNotification({
          title: 'Error',
          message: error,
          type: 'error',
        })
      }
    })
  }
}
</script>

<template>
  <div class="container">
    <div class="list-header">
      <el-button
        :icon="svgRender(mdiFileImagePlus)"
        :disabled="image.isProcessing"
        class="color-override"
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

      <el-button
        plain
        :icon="svgRender(mdiFolderOpen)"
        :disabled="image.output === ''"
        class="color-override"
        @click="openOutputFolder"
      >
        Open Output Folder
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
  display: flex;
  padding: 12px 20px;
  background-color: #fff;
  border-bottom: 1px solid var(--el-border-color);

  .el-button {
    &:not(.is-plain) {
      font-weight: 700;
    }

    &:last-child {
      margin-left: auto;
    }

    :deep(.el-icon) {
      font-size: 1.2em;
    }
  }
}

.list-wrapper {
  min-height: 0;
}
</style>
