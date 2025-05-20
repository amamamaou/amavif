<script setup lang="ts">
import { onMounted } from 'vue'
import useImageStore from '@/store/image'

import AppLayout from '@/layout/AppLayout.vue'

const image = useImageStore()

onMounted(() => image.loadSettings())
</script>

<template>
  <AppLayout />
</template>
