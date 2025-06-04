<script setup lang="ts">
import useImageStore from '@/store/image'
import AppLayout from '@/layout/AppLayout.vue'

const image = useImageStore()
onMounted(() => image.loadSettings())
</script>

<template>
  <AppLayout />
</template>
