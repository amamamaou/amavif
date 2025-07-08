<script setup lang="ts">
import ListHeader from '@/components/ListHeader.vue'
import ImageList from '@/components/ImageList.vue'
import ListStatus from '@/components/ListStatus.vue'

const image = useImageStore()
</script>

<template>
  <div class="list-container">
    <ListHeader />

    <el-scrollbar>
      <ImageList :data="image.standby" />
      <ImageList :data="image.complete" is-complete />
    </el-scrollbar>

    <ListStatus />
  </div>
</template>

<style scoped>
.list-container {
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100%;
}

.el-scrollbar {
  --el-scrollbar-opacity: 0.5;
  --el-scrollbar-hover-opacity: 0.8;

  min-height: 0;
}
</style>
