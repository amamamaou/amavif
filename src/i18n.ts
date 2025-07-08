import { createI18n } from 'vue-i18n'
import { watch } from 'vue'
import { LazyStore } from '@tauri-apps/plugin-store'

import en from '@/locales/en.json'
import ja from '@/locales/ja.json'

const store = new LazyStore('settings.json')

export const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: { en, ja },
})

export async function initI18n(): Promise<void> {
  const locale = await store.get<'en' | 'ja'>('locale')
  if (locale) i18n.global.locale.value = locale

  watch(i18n.global.locale, async (value) => {
    await store.set('locale', value)
  }, { immediate: true })
}

export const t = i18n.global.t
