module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    'plugin:import/recommended'
  ],
  plugins: ['import'],
  parserOptions: {
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
    // ファイル拡張子の強制
    'import/extensions': ['error', 'always'],
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
}; 