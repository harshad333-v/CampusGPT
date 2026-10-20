import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Existing pages perform asynchronous fetches from mount effects. The
      // rule flags those calls at the call site despite state updates occurring
      // after the network settles; keep the other React Hooks rules enabled.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    files: ['src/context/ThemeContext.jsx'],
    rules: {
      'react-refresh/only-export-components': ['error', { allowExportNames: ['ThemeContext'] }],
    },
  },
  {
    files: ['vite.config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
])
