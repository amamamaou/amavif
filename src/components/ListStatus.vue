<script setup lang="ts">
import { formatBytes } from '@/libs/utils'
import { mdiArrowRight } from '@mdi/js'
import SvgIcon from '@/components/SvgIcon.vue'

const { t } = useI18n()
const image = useImageStore()
const size = computed<Amavif.FileSize>(() => image.convertedSize)
</script>

<template>
  <dl class="list-status">
    <div
      v-if="image.standby.size > 0"
      class="cell"
    >
      <dt>{{ t('label.queue') }}</dt>
      <dd>
        <span class="total">{{ image.standby.size }}</span>
        <el-tag type="info" size="small">
          {{ formatBytes(image.standbySize) }}
        </el-tag>
      </dd>
    </div>

    <div
      v-if="image.complete.size > 0"
      class="cell"
    >
      <dt>{{ t('label.converted') }}</dt>
      <dd>
        <span class="total">{{ image.complete.size }}</span>

        <el-tag type="info" size="small" class="before">
          {{ formatBytes(size.before) }}
        </el-tag>

        <SvgIcon :path="mdiArrowRight" />

        <el-tag type="primary" size="small" class="after">
          {{ formatBytes(size.after) }}
        </el-tag>

        <el-tag
          :type="size.before - size.after > 0 ? 'success' : 'warning'"
          effect="dark"
          size="small"
          class="size"
        >
          {{ (size.after / size.before * 100 - 100).toFixed(1) }}%
        </el-tag>
      </dd>
    </div>
  </dl>
</template>

<i18n lang="yaml">
en:
  label:
    queue: Queued Images
    converted: Converted Images

ja:
  label:
    queue: 待機中の画像
    converted: 変換済み画像
</i18n>

<style scoped>
.list-status {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 4px 20px;
  border-top: 1px solid var(--el-border-color);
  color: var(--el-text-color-regular);
  font-size: 1.2rem;

  .cell {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;

    dt::after {
        content: ":";
      }

    dd {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .total {
      margin-right: 6px;
    }

    .svg-icon {
      width: 14px;
    }

    .el-tag {
      &.size {
        margin-left: 6px;
      }
    }
  }
}
</style>
