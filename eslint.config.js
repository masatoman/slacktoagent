import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';

export default [
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.mjs'],
    plugins: {
      import: importPlugin
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    rules: {
      // モジュールエクスポート関連のルール
      'import/no-default-export': 'off',
      'import/prefer-default-export': 'off',
      'import/extensions': ['error', 'always', {
        'js': 'always',
        'mjs': 'always',
        'cjs': 'always'
      }],
      // 未使用のエクスポートを警告
      'import/no-unused-modules': ['warn', {
        'unusedExports': true
      }],
      // その他の一般的なルール
      'indent': ['error', 2],
      'linebreak-style': ['error', 'unix'],
      'quotes': ['error', 'single'],
      'semi': ['error', 'always']
    }
  }
]; 