import eslint from '@eslint/js'
import * as tseslint from '@typescript-eslint/eslint-plugin'
import tseslintParser from '@typescript-eslint/parser'
import eslintPluginCucumber from 'eslint-plugin-cucumber'
import eslintPluginImport from 'eslint-plugin-import'

export default [
  eslint.configs.recommended,
  {
    ignores: [
      'dist',
      'node_modules',
      'coverage',
      '*.d.ts',
      'test/fixtures',
      'test/temp',
      'test/data',
      'test/integration/fixtures',
      'test/integration/temp',
      'test/integration/data',
    ],
    files: ['**/*.ts', '**/*.js'],
    languageOptions: {
      parser: tseslintParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: 'tsconfig.json',
        tsconfigRootDir: process.cwd(),
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      cucumber: eslintPluginCucumber,
      import: eslintPluginImport,
    },
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/no-explicit-any': 'off',

      // General rules
      'no-console': 'off',
      'quotes': ['error', 'single'],
      'linebreak-style': ['error', 'unix'],
      'semi': ['error', 'never'],
      'max-len': ['warn', { code: 120 }],
      'no-duplicate-imports': 'error',
      'no-multiple-empty-lines': ['error', { max: 1 }],
      'no-trailing-spaces': 'error',
      'eol-last': 'error',

      // Import rules
      'import/default': 'warn',
      'import/extensions': 'off',
      'import/no-duplicates': 'error',
      'import/order': ['error', {
        'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        'alphabetize': { order: 'asc' }
      }],

      // Cucumber rules
      'cucumber/async-then': 'error',
      'cucumber/expression-type': 'error',
      'cucumber/no-arrow-functions': 'error',
    },
    settings: {
      'import/resolver': {
        typescript: {},
      },
    },
  },
  {
    files: ['test/**/*.ts'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['*.js'],
    languageOptions: {
      parserOptions: {
        project: null,
      },
      globals: {
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        process: 'readonly',
        exports: 'readonly',
        Buffer: 'readonly',
        setImmediate: 'readonly',
        clearImmediate: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },
  },
]
