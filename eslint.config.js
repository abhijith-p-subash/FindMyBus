import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'doc'] },

  // Application source
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // An empty catch is a deliberate choice throughout: localStorage can throw
      // in private mode, and a failed persist must never break rendering.
      'no-empty': ['error', { allowEmptyCatch: true }],

      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  // Three deliberate React-state-from-outside syncs: a URL query param, a
  // two-frame enter transition, and a full reset when the tracked key changes.
  // The rule fires on every setState in those blocks, so it is scoped off here
  // rather than littered with per-line suppressions. New files still get it.
  {
    files: ['src/App.tsx', 'src/components/AddTripSheet.tsx', 'src/hooks/useBusTracker.ts'],
    rules: { 'react-hooks/set-state-in-effect': 'off' },
  },

  // Service worker — runs in a worker scope, not the window
  {
    files: ['public/sw.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: { ...globals.serviceworker, ...globals.browser },
    },
  },

  // Config files run in Node
  {
    files: ['*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
)
