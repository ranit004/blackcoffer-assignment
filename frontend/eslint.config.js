import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';

/**
 * Flat ESLint config (ESLint 9+) for the frontend.
 * Mirrors the backend config; adds React-specific plugins and browser globals.
 * `eslint-config-prettier` is last so Prettier owns all formatting decisions.
 */
export default [
  { ignores: ['dist', 'playwright-report', 'test-results'] },
  js.configs.recommended,
  {
    // Node-context files: build/test config, Playwright specs, test setup.
    files: ['*.config.js', 'e2e/**/*.js', 'src/test/**/*.{js,jsx}'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]' }],
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  prettier,
];
