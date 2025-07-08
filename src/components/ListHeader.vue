<script setup lang="ts">
import { openFileExplorer, svgRender } from '@/libs/utils'
import AddImages from '@/components/AddImages.vue'
import LocaleSelect from '@/components/LocaleSelect.vue'
import { mdiArrowULeftTop, mdiFolderOpen, mdiTrashCanOutline } from '@mdi/js'

const { t } = useI18n()
const image = useImageStore()
</script>

<template>
  <div class="list-header">
    <el-button
      v-if="image.backup.size > 0"
      plain
      :icon="svgRender(mdiArrowULeftTop)"
      :disabled="image.isLocked"
      color="var(--color-primary)"
      @click="image.restore"
    >
      {{ t('button.again') }}
    </el-button>

    <AddImages>{{ t('button.add') }}</AddImages>

    <el-button
      type="danger"
      :icon="svgRender(mdiTrashCanOutline)"
      :disabled="image.isLocked"
      @click="image.removeItems"
    >
      {{ t('button.remove') }}
    </el-button>

    <el-button
      plain
      :icon="svgRender(mdiFolderOpen)"
      :disabled="image.output === ''"
      color="var(--color-primary)"
      class="flex-end"
      @click="openFileExplorer(image.output)"
    >
      {{ t('button.output') }}
    </el-button>

    <LocaleSelect />
  </div>
</template>

<i18n lang="yaml">
en:
  button:
    again: Convert Again
    add: Add Images
    remove: Remove All
    output: Open Output

ja:
  button:
    again: 変換をやり直す
    add: 画像を追加
    remove: すべて取り除く
    output: 出力先を開く
</i18n>

<style scoped>
.list-header {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  background-color: #fff;
  border-bottom: 1px solid var(--el-border-color);

  .el-button {
    &:not(:last-child) {
      font-weight: 600;
    }

    :deep(.el-icon) {
      font-size: 1.2em;
    }
  }

  .flex-end {
    margin-left: auto;
  }

  .locale-select {
    margin-left: 12px;
  }
}
</style>
