<script setup lang="ts">
import { openDialog, openFileExplorer, svgRender } from '@/libs/utils'
import useImageStore from '@/store/image'
import {
  mdiArrowULeftTop,
  mdiFileImagePlus,
  mdiFolderOpen,
  mdiTrashCanOutline,
} from '@mdi/js'

const image = useImageStore()

/** ダイアログを開いてファイル追加する */
async function addImages(): Promise<void> {
  const paths = await openDialog()
  image.addImages(paths)
}
</script>

<template>
  <div class="list-header">
    <el-button
      v-if="image.backup.size > 0"
      plain
      :icon="svgRender(mdiArrowULeftTop)"
      :disabled="image.isLocked"
      color="var(--color-primary)"
      @click="image.restore"
    >
      Convert Again
    </el-button>

    <el-button
      :icon="svgRender(mdiFileImagePlus)"
      :disabled="image.isLocked"
      color="var(--color-primary)"
      @click="addImages"
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
      @click="openFileExplorer(image.output)"
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
    &:not(:last-child) {
      font-weight: 600;
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
