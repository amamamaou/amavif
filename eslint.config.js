import js from '@eslint/js'
import ts from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'

export default [
  { ignores: ['dist'] },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    languageOptions: {
      parserOptions: {
        parser: '@typescript-eslint/parser',
        ecmaVersion: 2022,
      },
    },
  },
  {
    rules: {
      'vue/max-attributes-per-line': ['warn', { singleline: { max: 3 } }],
      'vue/singleline-html-element-content-newline': 'off',
      'indent': ['error', 2],
      'no-console': 'warn',
      'semi': ['error', 'never', { beforeStatementContinuationChars: 'never' }],
      'semi-spacing': ['error', { after: true, before: false }],
      'semi-style': ['error', 'first'],
      'no-extra-semi': 'error',
      'no-unexpected-multiline': 'error',
      'no-unreachable': 'error',
      'no-undef': 'off',
    },
  },
]
