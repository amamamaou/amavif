<script setup lang="ts">
import { svgRender } from '@/libs/utils'
import { mdiFileImagePlus } from '@mdi/js'

const image = useImageStore()
</script>

<template>
  <el-button
    type="primary"
    :icon="svgRender(mdiFileImagePlus)"
    :disabled="image.isLocked"
    @click="image.openDialog"
  >
    <slot />
  </el-button>
</template>
