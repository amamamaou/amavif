<script setup lang="ts">
import AddImages from '@/components/AddImages.vue'
import LocaleSelect from '@/components/LocaleSelect.vue'
import SvgIcon from '@/components/SvgIcon.vue'
import { mdiFileImagePlus } from '@mdi/js'

const { t } = useI18n()
</script>

<template>
  <div class="drop-zone">
    <LocaleSelect />

    <div class="drop-message">
      <SvgIcon :path="mdiFileImagePlus" class="icon" />
      <p class="text">{{ t('drop-text') }}</p>
    </div>

    <div class="drop-select">
      <span class="text">{{ t('drop-or') }}</span>
      <AddImages class="button">{{ t('select-image') }}</AddImages>
    </div>
  </div>
</template>

<i18n lang="yaml">
en:
  drop-text: Drop your images or folders here!
  drop-or: or
  select-image: Select Images

ja:
  drop-text: ここに画像またはフォルダをドラッグ＆ドロップ
  drop-or: または
  select-image: 画像を選択する
</i18n>

<style scoped>
.drop-zone {
  position: relative;
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

.locale-select {
  position: absolute;
  top: 12px;
  right: 20px;
}
</style>
