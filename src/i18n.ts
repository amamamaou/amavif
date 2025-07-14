import { createI18n } from 'vue-i18n'
import { load } from '@tauri-apps/plugin-store'

import en from '@/locales/en.json'
import ja from '@/locales/ja.json'

export const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: { en, ja },
})

export async function initI18n(): Promise<void> {
  const store = await load('settings.json')
  const locale = await store.get<'en' | 'ja'>('locale')
  if (locale) i18n.global.locale.value = locale
  watchEffect(() => store.set('locale', i18n.global.locale.value))
}

export const t = i18n.global.t
