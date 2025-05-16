<script setup lang="ts">
import { computed } from 'vue'
import { open } from '@tauri-apps/plugin-dialog'
import convertImage from '@/libs/convert'

import { ElNotification } from 'element-plus'
import useImageStore from '@/store/image'

const image = useImageStore()

const enableConvert = computed<boolean>(() => image.output !== '' && image.standby.size > 0)
const tooltipContent = computed<string>(() => {
  if (image.standby.size === 0) return 'No images selected'
  if (image.output === '') return 'Select output folder'
  return ''
})

/** 出力先選択 */
async function selectOutputPath() {
  const path = await open({
    title: 'Select Output',
    directory: true,
  })

  image.output = path ?? ''
}

/** 変換処理 */
async function convert() {
  const result = await convertImage(image)

  if (result) {
    ElNotification({
      title: 'Completed',
      message: 'All done! Your images are ready.',
      type: 'success',
    })
  } else {
    ElNotification({
      title: 'Failed',
      message: 'Oops! Couldn’t convert the images.',
      type: 'error',
    })
  }
}
</script>

<template>
  <el-form
    :inline="true"
    label-position="left"
    :disabled="image.isLoading || image.isProcessing"
  >
    <el-form-item label="Format" class="item-format">
      <el-select v-model="image.format" class="format-select">
        <el-option label="WebP" value="webp" />
        <el-option label="AVIF" value="avif" />
      </el-select>
    </el-form-item>

    <el-form-item label="Quality" class="item-quality">
      <el-slider
        v-model="image.quality"
        show-input
        class="quality-slider"
      />
    </el-form-item>

    <el-form-item label="Output" class="item-output">
      <el-button
        plain
        class="select-button color-override"
        @click="selectOutputPath"
      >
        Select
      </el-button>

      <el-input
        :value="image.output"
        placeholder="Plese Select..."
        readonly
        @click="selectOutputPath"
      />
    </el-form-item>

    <el-form-item class="item-button">
      <el-tooltip
        :content="tooltipContent"
        placement="top"
        :disabled="enableConvert"
      >
        <el-button
          size="large"
          class="convert-button color-override"
          :disabled="!enableConvert"
          @click="convert"
        >
          Convert
        </el-button>
      </el-tooltip>
    </el-form-item>
  </el-form>
</template>

<style scoped>
.el-form {
  display: grid;
  grid-template-columns: max(20%, 150px) 1fr 20%;
  grid-auto-rows: 32px;
  gap: 8px 20px;

  .el-form-item {
    --el-form-label-font-size: 1.3rem;

    margin: 0;

    :deep(.el-form-item__label) {
      flex-shrink: 0;
      width: 60px;
      padding-right: 0;
      font-weight: 700;
    }
  }

  .item-quality {
    :deep(.el-slider__runway) {
      margin-right: 24px;
    }

    :deep(.el-input-number) {
      width: 120px;
    }
  }

  .item-output {
    grid-area: 2 / 1 / 3 / 3;

    :deep(.el-form-item__content) {
      display: grid;
      grid-template-columns: 80px 1fr;
      gap: 8px;

      .el-input {
        --el-color-primary: var(--color-primary);
      }
    }
  }

  .item-button {
    grid-area: 1 / 3 / 3 / 4;
  }
}

.format-select {
  --el-color-primary: var(--color-primary);
}

.quality-slider {
  --el-slider-main-bg-color: var(--color-primary-light-1);

  :deep(.el-input),
  :deep(.el-input-number) {
    --el-color-primary: var(--color-primary);
  }
}

.select-button {
  font-weight: 700;
}

.convert-button {
  --el-font-size-base: 1.6rem;

  width: 100%;
  padding-inline: 32px;
  font-weight: 700;
}
</style>
