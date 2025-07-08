<script setup lang="ts">
import { mdiFileImagePlus } from '@mdi/js'
import SvgIcon from '@/components/SvgIcon.vue'

defineProps<{ isDropEnter: boolean }>()

const { t } = useI18n()
</script>

<template>
  <Teleport to="body">
    <Transition>
      <aside v-if="isDropEnter" class="drop-overlay">
        <div class="drop-message">
          <SvgIcon :path="mdiFileImagePlus" class="icon" />
          <p class="text">{{ t('drop-text') }}</p>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>

<i18n lang="yaml">
en:
  drop-text: Drop your images of folders here!

ja:
  drop-text: ここに画像またはフォルダをドラッグ＆ドロップ
</i18n>

<style scope>
.drop-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: var(--color-overlay);
  backdrop-filter: blur(10px);
  color: #fff;
}

.drop-message {
  text-align: center;

  .icon {
    width: 80px;
  }

  .text {
    margin-top: 8px;
    font-size: 1.8rem;
    font-weight: 700;
  }
}

.v-enter-active,
.v-leave-active {
  transition: opacity 0.2s;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
