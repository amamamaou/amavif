<script setup lang="ts">
import useImageStore from '@/store/image'
import DropZone from '@/components/DropZone.vue'
import ListContainer from '@/components/ListContainer.vue'

const image = useImageStore()
</script>

<template>
  <DropZone v-if="image.isEmpty" />
  <ListContainer v-else />
</template>
