<script setup lang="ts">
import useImageStore from '@/store/image'
import DropZone from '@/components/DropZone.vue'
import ListContainer from '@/components/ListContainer.vue'

const image = useImageStore()
</script>

<template>
  <ListContainer v-if="image.standby.size > 0 || image.complete.size > 0" />
  <DropZone v-else />
</template>
