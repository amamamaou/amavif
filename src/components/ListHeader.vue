<script setup lang="ts">
import { openDialog, openFileExplorer, svgRender } from '@/libs/utils'
import useImageStore from '@/store/image'
import { mdiFileImagePlus, mdiFolderOpen, mdiTrashCanOutline } from '@mdi/js'

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
