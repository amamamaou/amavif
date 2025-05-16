import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

import '@/style/main.css'
import '@/style/element-plus/index.css'

createApp(App).use(createPinia()).mount('#app')
