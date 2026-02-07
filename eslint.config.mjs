import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist', 'node_modules', '.turbo', 'coverage']),
  eslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [tseslint.configs.recommendedTypeChecked, tseslint.configs.stylisticTypeChecked],
    plugins: {
      import: importPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      parserOptions: {
        projectService: true,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'none',
          vars: 'all',
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          caughtErrors: 'none',
        },
      ],
      'import/no-duplicates': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-extraneous-class': 'off',
    },
  },
  prettier,
]);
