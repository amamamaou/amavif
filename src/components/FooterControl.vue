<script setup lang="ts">
const { t } = useI18n()
const image = useImageStore()

/** バージョン */
const APP_VERSION = import.meta.env.VITE_APP_VERSION

/** ツールチップメッセージ */
const tooltipContent = computed<string>(() => {
  if (image.standby.size === 0) return t('tooltip.image')
  if (image.options.output === '') return t('tooltip.output')
  return ''
})
</script>

<template>
  <el-form
    inline
    label-position="left"
    :disabled="image.isLocked"
  >
    <el-form-item
      :label="t('label.format')"
      class="item-format"
    >
      <el-select
        v-model="image.options.format"
        class="format-select"
      >
        <el-option value="webp" label="WebP" />
        <el-option value="avif" label="AVIF" />
      </el-select>
    </el-form-item>

    <el-form-item
      :label="t('label.quality')"
      class="item-quality"
    >
      <el-slider
        v-model="image.options.quality"
        show-input
        class="quality-slider"
      />
    </el-form-item>

    <el-form-item
      :label="t('label.output')"
      class="item-output"
    >
      <el-button
        type="primary"
        plain
        class="select-button"
        @click="image.selectOutput"
      >
        {{ t('button.output') }}
      </el-button>

      <el-input
        :value="image.options.output"
        :placeholder="t('placeholder')"
        readonly
        @click="image.selectOutput"
      />
    </el-form-item>

    <el-form-item class="item-button">
      <el-tooltip
        :content="tooltipContent"
        placement="top"
        :disabled="image.canConvert"
      >
        <el-button
          type="primary"
          size="large"
          class="convert-button"
          :disabled="!image.canConvert"
          @click="image.convertImages"
        >
          {{ t('button.convert') }}
        </el-button>
      </el-tooltip>

      <div class="version">v{{ APP_VERSION }}</div>
    </el-form-item>
  </el-form>
</template>

<i18n lang="yaml">
en:
  placeholder: Plese Select...
  button:
    convert: Convert
    output: Select
  label:
    format: Format
    quality: Quality
    output: Output
  tooltip:
    image: No images selected
    output: Select output folder

ja:
  placeholder: 出力先を選択してください
  button:
    convert: 変換開始
    output: 選択
  label:
    format: 画像形式
    quality: 画質
    output: 出力先
  tooltip:
    image: 変換する画像がありません
    output: 出力先を選択してください
</i18n>

<style scoped>
.el-form {
  display: grid;
  grid-template-columns: max(20%, 150px) 1fr 20%;
  grid-auto-rows: 32px;
  gap: 8px 20px;
  width: min(100%, 900px);

  .el-form-item {
    --el-form-label-font-size: 1.3rem;

    margin: 0;

    :deep(.el-form-item__label) {
      flex-shrink: 0;
      width: 60px;
      padding-right: 0;
      color: var(--color-text);
      font-weight: 600;
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

    :deep(.el-form-item__content) {
      justify-content: center;
      align-items: end;
    }

    .version {
      color: var(--el-text-color-regular);
      font-size: 1.2rem;
      font-weight: 600;
      line-height: 1;
    }
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
