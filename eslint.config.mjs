import js from '@eslint/js';
import globals from 'globals';
import next from 'eslint-config-next';
import prettier from 'eslint-config-prettier';

const config = [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'coverage/**',
      'reports/**',
      'playwright-report/**',
      'public/sw.js',
      'public/workbox-*.js',
      'public/swe-worker-*.js',
      '_usability/**',
      'frontend/**',
    ],
  },
  js.configs.recommended,
  ...next,
  prettier,
  {
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  // App Router uses layout.jsx for fonts — this rule targets Pages Router _document.js only
  {
    files: ['app/**'],
    rules: {
      '@next/next/no-page-custom-font': 'off',
    },
  },
  // TypeScript files: disable JS no-unused-vars (TS compiler handles this;
  // constructor parameter properties like `protected page: Page` are falsely flagged)
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'no-unused-vars': 'off',
    },
  },
  // Node.js native test runner + Mocha (test/unit, test/integration, test/api)
  {
    files: ['test/unit/**', 'test/integration/**', 'test/api/**'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.mocha,
      },
    },
  },
  // Vitest (test/frontend)
  {
    files: ['test/frontend/**'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.vitest,
      },
    },
  },
  // Playwright E2E
  {
    files: ['e2e/**'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
];

export default config;
