<script setup lang="ts">
import { openDialog, svgRender } from '@/libs/utils'
import { mdiFileImagePlus } from '@mdi/js'

const image = useImageStore()

/** ダイアログを開いてファイル追加する */
async function addImages(): Promise<void> {
  const paths = await openDialog()
  image.addImages(paths)
}
</script>

<template>
  <el-button
    :icon="svgRender(mdiFileImagePlus)"
    :disabled="image.isLocked"
    color="var(--color-primary)"
    @click="addImages"
  >
    <slot />
  </el-button>
</template>
