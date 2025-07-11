<script setup lang="ts">
import { formatBytes } from '@/libs/utils'
import { mdiArrowRight } from '@mdi/js'
import SvgIcon from '@/components/SvgIcon.vue'

const { t } = useI18n()
const image = useImageStore()

/** 待機中の画像の合計サイズ */
const beforeSize = computed<number>(() => {
  let total = 0
  for (const { size } of image.standby.values()) {
    total += size.before
  }
  return total
})

/** 変換前と変換後の画像の合計サイズ */
const afterSize = reactive({ before: 0, after: 0 })
watchEffect(() => {
  let before = 0
  let after = 0

  // reactiveなオブジェクトに直接足すのは避ける
  for (const { size } of image.complete.values()) {
    before += size.before
    after += size.after
  }

  afterSize.before = before
  afterSize.after = after
})

const tagType = computed(() => afterSize.before - afterSize.after > 0 ? 'success' : 'warning')
const ratio = computed<number>(() => afterSize.after / afterSize.before * 100 - 100)
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
          {{ formatBytes(beforeSize) }}
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
          {{ formatBytes(afterSize.before) }}
        </el-tag>

        <SvgIcon :path="mdiArrowRight" />

        <el-tag type="primary" size="small" class="after">
          {{ formatBytes(afterSize.after) }}
        </el-tag>

        <el-tag
          :type="tagType"
          effect="dark"
          size="small"
          class="size"
        >
          {{ ratio.toFixed(1) }}%
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
