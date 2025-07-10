<script setup lang="ts">
import { getFormatName, formatBytes, svgRender } from '@/libs/utils'
import { mdiArrowRight, mdiCheckCircle, mdiLoupe, mdiTrashCanOutline } from '@mdi/js'
import SvgIcon from '@/components/SvgIcon.vue'

defineProps<{
  data: Amavif.InfoMap;
  isComplete?: boolean;
}>()

const { t } = useI18n()
const image = useImageStore()

const LoupeIcon = svgRender(mdiLoupe)
const TrashIcon = svgRender(mdiTrashCanOutline)

/** 画像がエラーになったときの通知 */
function imageErrorNotice(uuid: string, fileName: string): void {
  image.removeItem(uuid)

  ElNotification.error({
    title: t('error.title'),
    message: t('error.msg', { fileName }),
  })
}

/** 画像プレビュー */
function previewImage(id: string): void {
  const el = document.getElementById('image-' + id)
  el?.firstElementChild?.dispatchEvent(new Event('click'))
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
        <el-image
          :id="`image-${uuid}`"
          :src="item.fileSrc"
          :alt="item.fileName"
          :preview-src-list="[item.fileSrc]"
          preview-teleported
          hide-on-click-modal
          @error="imageErrorNotice(uuid, item.fileName)"
        />
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
            {{ getFormatName(item.mime) }}
          </el-tag>

          <SvgIcon :path="mdiArrowRight" />

          <el-tag type="success">
            {{ getFormatName(image.options.format) }}
          </el-tag>
        </div>

        <div
          v-else
          class="item-info"
        >
          <el-tag type="success">
            {{ getFormatName(item.mime) }}
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

      <div class="item-buttons">
        <el-tooltip
          :content="t('tooltip.preview')"
          placement="top"
          :hide-after="0"
        >
          <el-button
            :icon="LoupeIcon"
            circle
            plain
            color="var(--color-primary)"
            @click="previewImage(uuid)"
          />
        </el-tooltip>

        <el-tooltip
          :content="t('tooltip.remove')"
          placement="top"
          :hide-after="0"
        >
          <el-button
            type="danger"
            :icon="TrashIcon"
            circle
            plain
            :disabled="image.isLocked"
            @click="image.removeItem(uuid)"
          />
        </el-tooltip>
      </div>
    </li>
  </ul>
</template>

<i18n lang="yaml">
en:
  error:
    title: Unsupported image file
    msg: "Oops! '{fileName}' isn’t a supported image."
  tooltip:
    preview: Click to preview
    remove: Remove this item

ja:
  error:
    title: 非対応の画像ファイル
    msg: "'{fileName}' は変換に対応していない画像です。"
  tooltip:
    preview: 画像のプレビュー
    remove: この画像を取り除く
</i18n>

<style scoped>
.image-list {
  list-style: none;
  padding: 0 20px;

  &:last-child .list-item:last-child {
    box-shadow: 0 1px 0 0 var(--el-border-color);
  }

  &:nth-child(2) .list-item {
    border-top: 1px solid var(--el-border-color);
  }

  &.is-complete {
    background-color: var(--el-color-info-light-9);
  }
}

.list-item {
  position: relative;
  display: grid;
  grid-template-columns: 100px 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 12px 0;

  &:nth-child(n+2) {
    border-top: 1px solid var(--el-border-color);
  }

  .status-complete {
    position: absolute;
    top: 14px;
    left: 2px;
    z-index: 10;
    width: 14px;
    background-color: #fff;
    border-radius: 50%;
    color: var(--el-color-success);
    pointer-events: none;
  }

  .item-image {
    .el-image {
      width: 100%;
      aspect-ratio: 16/9;
      vertical-align: bottom;

      :deep(img) {
        object-fit: contain;
        transition: background-color 0.2s, opacity 0.2s;

        &:hover {
          background-color: rgb(0 0 0 / 5%);
          opacity: 0.8;
        }
      }
    }
  }

  .item-content {
    min-width: 0;
  }

  .item-filename {
    overflow: hidden;
    width: 100%;
    text-overflow: ellipsis;
    font-size: 1.45rem;
    font-weight: 700;
    line-height: 1.4;
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
