<script setup lang="ts">
import { svgRender } from '@/libs/utils'
import { mdiTranslate } from '@mdi/js'

const { locale } = useI18n()
</script>

<template>
  <div class="locale-select">
    <el-dropdown trigger="click" popper-class="locale-dropdown">
      <el-button
        :icon="svgRender(mdiTranslate)"
        circle
        plain
      />
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item
            :class="{ 'is-current': locale === 'en' }"
            @click="locale = 'en'"
          >
            English
          </el-dropdown-item>
          <el-dropdown-item
            :class="{ 'is-current': locale === 'ja' }"
            @click="locale = 'ja'"
          >
            日本語
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<style scoped>
.locale-select {
  display: inline-block;
}
</style>

<style>
.locale-dropdown {
  .is-current {
    color: var(--el-color-primary);
    font-weight: bold;
  }
}
</style>
