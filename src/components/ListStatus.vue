<script setup lang="ts">
import { computed } from 'vue'
import { formatBytes } from '@/libs/utils'
import useImageStore from '@/store/image'

import { mdiArrowRight } from '@mdi/js'
import SvgIcon from '@/components/SvgIcon.vue'

const image = useImageStore()
const size = computed<FileSizeData>(() => image.convertedSize)
</script>

<template>
  <dl class="list-status">
    <div
      v-if="image.standby.size > 0"
      class="cell"
    >
      <dt>Queued Images</dt>
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
      <dt>Converted Images</dt>
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
    font-weight: 700;

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
