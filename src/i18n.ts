import { createI18n } from 'vue-i18n'
import { load } from '@tauri-apps/plugin-store'

import en from '@/locales/en.json'
import ja from '@/locales/ja.json'

const STORE_FILE = import.meta.env.VITE_STORE_FILE

export const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: { en, ja },
})

export const t = i18n.global.t

load(STORE_FILE).then(async (store) => {
  const locale = await store.get<'en' | 'ja'>('locale')
  if (locale) i18n.global.locale.value = locale
  watchEffect(() => store.set('locale', i18n.global.locale.value))
})
