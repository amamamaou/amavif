<script setup lang="ts">
import { openDialog, openFileExplorer, svgRender } from '@/libs/utility'
import useImageStore from '@/store/image'

import { ElNotification } from 'element-plus'
import { mdiFileImagePlus, mdiFolderOpen, mdiTrashCanOutline } from '@mdi/js'

const image = useImageStore()

/** ダイアログを開いてファイル追加する */
async function addItems(): Promise<void> {
  const paths = await openDialog()
  image.addItems(paths)
}

/** 出力先を開く */
function openOutputFolder(): void {
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
  <div class="list-header">
    <el-button
      :icon="svgRender(mdiFileImagePlus)"
      :disabled="image.isLocked"
      color="var(--color-primary)"
      @click="addItems"
    >
      Add Images
    </el-button>

    <el-button
      type="danger"
      :icon="svgRender(mdiTrashCanOutline)"
      :disabled="image.isLocked"
      @click="image.removeItems"
    >
      Remove All
    </el-button>

    <el-button
      plain
      :icon="svgRender(mdiFolderOpen)"
      :disabled="image.output === ''"
      color="var(--color-primary)"
      @click="openOutputFolder"
    >
      Open Output
    </el-button>
  </div>
</template>

<style scoped>
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
</style>
