<script setup lang="ts">
import FooterControl from '@/components/FooterControl.vue'
import DropZone from '@/components/DropZone.vue'
import ListContainer from '@/components/ListContainer.vue'

const image = useImageStore()
</script>

<template>
  <el-container>
    <el-main>
      <DropZone v-if="image.isEmpty" />
      <ListContainer v-else />
    </el-main>

    <el-footer>
      <FooterControl />
    </el-footer>
  </el-container>
</template>

<style scoped>
.el-container {
  height: 100dvh;
}

.el-main {
  padding: 0;
}

.el-footer {
  --el-footer-height: 96px;

  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px solid var(--el-border-color);
}
</style>
