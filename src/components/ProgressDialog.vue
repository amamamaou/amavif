<script setup lang="ts">
const { t } = useI18n()
const image = useImageStore()

/** 進捗率 */
const percentage = computed<number>(() => {
  const { total, count } = image.progress
  if (total === 0) return 0
  return Math.min(Math.floor(count / total * 100), 100)
})

/** ダイアログテキスト */
const dialogText = computed<string>(() => {
  if (image.progress.status === 'loading') return t('loading')
  if (image.progress.status === 'converting') return t('converting')
  return t('done')
})
</script>

<template>
  <el-dialog
    :model-value="image.isLocked"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    align-center
  >
    <div class="dialog-content">
      <el-progress
        v-if="percentage === 0"
        :stroke-width="24"
        :percentage="100"
        :show-text="false"
        striped
        striped-flow
        :duration="10"
        color="var(--color-primary-light-2)"
      />

      <el-progress
        v-else
        text-inside
        :stroke-width="24"
        :percentage="percentage"
        color="var(--color-primary)"
      />

      <div class="dialog-text">{{ dialogText }}</div>
    </div>
  </el-dialog>
</template>

<i18n lang="yaml">
en:
  loading: Loading Images...
  converting: Converting Images...
  done: Done

ja:
  loading: 画像を読込中...
  converting: 画像を変換中...
  done: 完了
</i18n>

<style scoped>
.dialog-text {
  margin-block: 24px;
  font-size: 1.6rem;
  font-weight: 600;
  text-align: center;
}

.el-progress {
  :deep(.el-progress-bar__inner) {
    transition-duration: 0.3s;
  }
}
</style>
