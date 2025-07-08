import { defineConfig } from 'eslint/config'
import globals from 'globals'
import pluginJs from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import stylistic from '@stylistic/eslint-plugin'
import autoImportGlobals from './.eslintrc-auto-import.json' with { type: 'json' }

export default defineConfig(
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...autoImportGlobals.globals,
      },

      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
        sourceType: 'module',
      },
    },
    plugins: {
      '@stylistic': stylistic,
      vue: pluginVue,
    },
    rules: {
      '@stylistic/indent': ['error', 2],
      '@stylistic/quotes': ['warn', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
      '@stylistic/semi': ['error', 'never', { beforeStatementContinuationChars: 'never' }],
      '@stylistic/semi-spacing': ['error', { after: true, before: false }],
      '@stylistic/semi-style': ['error', 'first'],
      'no-console': 'warn',
      'vue/html-indent': 'error',
      'vue/max-attributes-per-line': ['warn', { singleline: { max: 3 } }],
      'vue/singleline-html-element-content-newline': 'off',
    },
  },
  {
    ignores: ['dist/', 'node_modules/'],
  },
)
