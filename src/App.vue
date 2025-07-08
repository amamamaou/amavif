<script setup lang="ts">
import AppLayout from '@/layout/AppLayout.vue'
import { initI18n } from '@/i18n'

const image = useImageStore()
onMounted(() => {
  initI18n()
  image.loadSettings()
})
</script>

<template>
  <AppLayout />
</template>
