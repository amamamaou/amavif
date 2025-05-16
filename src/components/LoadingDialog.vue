<script setup lang="ts">
import { computed } from 'vue'
import useImageStore from '@/store/image'

const image = useImageStore()

const percentage = computed<number>(() => {
  if (image.load.total === 0) return 0
  return Math.floor(image.load.count / image.load.total * 100)
})
</script>

<template>
  <el-dialog
    v-model="image.isLoading"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    align-center
  >
    <div class="dialog-content">
      <el-progress
        :text-inside="true"
        :stroke-width="24"
        :percentage="percentage"
        color="var(--color-primary)"
      />

      <div class="loading-text">Loading images...</div>
    </div>
  </el-dialog>
</template>

<style scoped>
.loading-text {
  margin-block: 24px;
  font-size: 1.8rem;
  font-weight: 700;
  text-align: center;
}
</style>
