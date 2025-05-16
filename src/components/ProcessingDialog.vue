<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { listen } from '@tauri-apps/api/event'
import useImageStore from '@/store/image'

const image = useImageStore()
const count = ref(0)

const percentage = computed<number>(() => {
  if (image.standby.size === 0) return 100
  return Math.min(Math.floor(count.value / image.standby.size * 100), 100)
})

// 値のリセット処理
watchEffect(() => {
  if (image.isProcessing) {
    count.value = 0
  }
})

// 進捗処理
listen('progress', (event) => {
  const uuid = (event.payload as { uuid: string }).uuid
  if (image.standby.has(uuid)) count.value++
})
</script>

<template>
  <el-dialog
    v-model="image.isProcessing"
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
        :text-inside="true"
        :stroke-width="24"
        :percentage="percentage"
        color="var(--color-primary)"
      />

      <div class="processing-text">Converting images...</div>
    </div>
  </el-dialog>
</template>

<style scoped>
.processing-text {
  margin-block: 24px;
  font-size: 1.8rem;
  font-weight: 700;
  text-align: center;
}
</style>
