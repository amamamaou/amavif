<script setup lang="ts">
import { openDialog, svgRender } from '@/libs/utils'
import useImageStore from '@/store/image'

import { mdiFileImagePlus } from '@mdi/js'
import SvgIcon from '@/components/SvgIcon.vue'

const image = useImageStore()

/** ダイアログを開いてファイル追加する */
async function addImages(): Promise<void> {
  const paths = await openDialog()
  image.addImages(paths)
}
</script>

<template>
  <div class="drop-zone">
    <div class="drop-message">
      <SvgIcon :path="mdiFileImagePlus" class="icon" />
      <p class="text">Drop your images here!</p>
    </div>

    <div class="drop-select">
      <span class="text">or</span>
      <el-button
        :icon="svgRender(mdiFileImagePlus)"
        color="var(--color-primary)"
        class="button"
        @click="addImages"
      >
        Select Images
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text);
}

.drop-message {
  text-align: center;

  .icon {
    width: 80px;
    color: var(--color-primary);
  }

  .text {
    margin-top: 8px;
    font-size: 1.8rem;
    font-weight: 700;
  }
}

.drop-select {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 16px;

  .text {
    margin-right: 8px;
    font-size: 1.6rem;
    font-weight: 600;
  }

  .button {
    font-weight: 700;

    :deep(.el-icon) {
      font-size: 1.2em;
    }
  }
}
</style>
