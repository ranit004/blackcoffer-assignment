import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

/**
 * Flat ESLint config (ESLint 9+) for the backend.
 * Mirrors the frontend config's style rules; `eslint-config-prettier` disables any
 * formatting rules that would conflict with Prettier so the two tools don't fight.
 */
export default [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },
  {
    // Test files also get Jest/Vitest globals (suites arrive in later prompts).
    files: ['**/*.test.js', 'src/tests/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },
  prettier,
];
