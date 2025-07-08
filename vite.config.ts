import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import { Features } from 'lightningcss'

const host = process.env.TAURI_DEV_HOST

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      dts: './src/auto-imports.d.ts',
      eslintrc: {
        enabled: true,
        globalsPropValue: 'readonly',
      },
      imports: [
        'vue',
        'vue-i18n',
        {
          from: '@/store/image',
          imports: [['default', 'useImageStore']],
        },
        {
          from: '@/types/globals',
          imports: ['Amavif'],
          type: true,
        },
      ],
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      dts: false,
      resolvers: [ElementPlusResolver()],
    }),
    VueI18nPlugin(),
  ],

  resolve: {
    alias: {
      '@/': `${import.meta.dirname}/src/`,
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,

  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
        protocol: 'ws',
        host,
        port: 1421,
      }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**'],
    },
  },

  // CSS settings
  css: {
    transformer: 'lightningcss',
    lightningcss: {
      exclude: Features.VendorPrefixes,
    },
  },

  build: {
    cssMinify: 'lightningcss',
  },
})
