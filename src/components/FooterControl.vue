<script setup lang="ts">
import { computed } from 'vue'
import { selectDialog } from '@/libs/utils'
import useImageStore from '@/store/image'

const image = useImageStore()

const format = computed<ImageFormat>({
  get() { return image.format },
  set(value) { image.setFormat(value) },
})

const quality = computed<number>({
  get() { return image.quality },
  set(value) { image.setQuality(value) },
})

/** ツールチップメッセージ */
const tooltipContent = computed<string>(() => {
  if (image.standby.size === 0) return 'No images selected'
  if (image.output === '') return 'Select output folder'
  return ''
})

/** 出力先選択 */
async function selectOutput(): Promise<void> {
  const path = await selectDialog(image.output)
  image.setOutput(path)
}
</script>

<template>
  <el-form
    inline
    label-position="left"
    :disabled="image.isLocked"
  >
    <el-form-item label="Format" class="item-format">
      <el-select v-model="format" class="format-select">
        <el-option label="WebP" value="webp" />
        <el-option label="AVIF" value="avif" />
      </el-select>
    </el-form-item>

    <el-form-item label="Quality" class="item-quality">
      <el-slider
        v-model="quality"
        show-input
        class="quality-slider"
      />
    </el-form-item>

    <el-form-item label="Output" class="item-output">
      <el-button
        plain
        color="var(--color-primary)"
        class="select-button"
        @click="selectOutput"
      >
        Select
      </el-button>

      <el-input
        :value="image.output"
        placeholder="Plese Select..."
        readonly
        @click="selectOutput"
      />
    </el-form-item>

    <el-form-item class="item-button">
      <el-tooltip
        :content="tooltipContent"
        placement="top"
        :disabled="image.canConvert"
      >
        <el-button
          size="large"
          color="var(--color-primary)"
          class="convert-button"
          :disabled="!image.canConvert"
          @click="image.convert"
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
      color: var(--color-text);
      font-weight: 700;
    }
  }

  .item-quality {
    :deep(.el-slider__runway) {
      margin-right: 24px;
    }

    :deep(.el-input) {
      --el-input-text-color: var(--color-text);
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
  --el-input-text-color: var(--color-text);
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
