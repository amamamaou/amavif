<script setup lang="ts">
defineProps<{ path: string }>()
</script>

<template>
  <svg class="svg-icon" viewBox="0 0 24 24">
    <path :d="path" />
  </svg>
</template>

<style scoped>
.svg-icon {
  width: 1em;

  path {
    fill: currentcolor;
  }
}
</style>
