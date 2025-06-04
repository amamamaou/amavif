<script setup lang="ts">
import { computed } from 'vue'
import useImageStore from '@/store/image'

const image = useImageStore()

/** 進捗率 */
const percentage = computed<number>(() => {
  const { total, count } = image.progress
  if (total === 0) return 0
  return Math.min(Math.floor(count / total * 100), 100)
})

/** ダイアログテキスト */
const dialogText = computed<string>(() => {
  if (image.status === 'loading') return 'Loading images...'
  if (image.status === 'converting') return 'Converting images...'
  return ''
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

<style scoped>
.dialog-text {
  margin-block: 24px;
  font-size: 1.6rem;
  font-weight: 600;
  text-align: center;
}
</style>
