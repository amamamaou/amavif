<script setup lang="ts">
import { convertFileSrc } from '@tauri-apps/api/core'

import { formatBytes, getFormatName } from '@/libs/utility'
import useImageStore from '@/store/image'
import { ElNotification } from 'element-plus'

import {
  mdiArrowRight,
  mdiCheckCircle,
  mdiTrashCanOutline,
} from '@mdi/js'
import SvgIcon from '@/components/SvgIcon.vue'
import svgRender from '@/render/svg-render'

withDefaults(defineProps<{
  data: FileInfoMap;
  isComplete?: boolean;
}>(), {
  isComplete: false,
})

const TrashIcon = svgRender(mdiTrashCanOutline)
const image = useImageStore()

/** 画像がエラーになったときの通知 */
function imageErrorNotice(uuid: string, fileName: string) {
  image.removeItem(uuid)

  ElNotification({
    title: 'Unsupported Image File',
    message: `Oops! '${fileName}' isn’t a supported image.`,
    type: 'error',
  })
}
</script>

<template>
  <ul
    v-if="data.size > 0"
    class="image-list"
    :class="{ 'is-complete': isComplete }"
  >
    <li
      v-for="[uuid, { size, ...item }] of [...data].reverse()"
      :key="uuid"
      class="list-item"
    >
      <SvgIcon
        v-if="isComplete"
        :path="mdiCheckCircle"
        class="status-complete"
      />

      <figure class="item-image">
        <img
          :src="convertFileSrc(item.path)"
          :alt="item.fileName"
          @error="imageErrorNotice(uuid, item.fileName)"
        >
      </figure>

      <div class="item-content">
        <div class="item-filename">
          {{ item.fileName }}
        </div>

        <div
          v-if="!isComplete"
          class="item-info"
        >
          <el-tag type="info">
            {{ formatBytes(size.before) }}
          </el-tag>

          <el-tag type="primary">
            {{ getFormatName(item.mimeType) }}
          </el-tag>

          <SvgIcon :path="mdiArrowRight" />

          <el-tag type="success">
            {{ getFormatName(image.format) }}
          </el-tag>
        </div>

        <div
          v-else
          class="item-info"
        >
          <el-tag type="success">
            {{ getFormatName(item.mimeType) }}
          </el-tag>

          <el-tag type="info" class="before">
            {{ formatBytes(size.before) }}
          </el-tag>

          <SvgIcon :path="mdiArrowRight" />

          <el-tag type="primary" class="after">
            {{ formatBytes(size.after) }}
          </el-tag>

          <el-tag
            :type="size.before - size.after > 0 ? 'success' : 'warning'"
            effect="dark"
            class="size"
          >
            {{ (size.after / size.before * 100 - 100).toFixed(1) }}%
          </el-tag>
        </div>
      </div>

      <div class="item-remove">
        <el-button
          type="danger"
          :icon="TrashIcon"
          circle
          plain
          :disabled="image.isProcessing"
          @click="image.removeItem(uuid)"
        />
      </div>
    </li>
  </ul>
</template>

<style scoped>
.image-list {
  list-style: none;
  padding: 0 20px;

  + .image-list .list-item {
    border-top: 1px solid var(--el-border-color);
  }

  &.is-complete {
    background-color: var(--el-color-info-light-9);
  }
}

.list-item {
  position: relative;
  z-index: 0;
  display: grid;
  grid-template-columns: 110px 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 16px 0;

  &:nth-child(n+2) {
    border-top: 1px solid var(--el-border-color);
  }

  .status-complete {
    position: absolute;
    top: 20px;
    left: 4px;
    width: 16px;
    background-color: #fff;
    border-radius: 50%;
    color: var(--el-color-success);
    pointer-events: none;
  }

  .item-image {
    img {
      width: 100%;
      aspect-ratio: 16/9;
      object-fit: contain;
    }
  }

  .item-content {
    min-width: 0;
  }

  .item-filename {
    overflow: hidden;
    width: 100%;
    text-overflow: ellipsis;
    font-size: 1.5rem;
    font-weight: 700;
    white-space: nowrap;
  }

  .item-info {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 8px;

    .svg-icon {
      width: 16px;
    }

    .el-tag {
      font-weight: 700;

      &.after,
      &.size {
        font-size: 1.3rem;
      }
    }
  }
}
</style>
