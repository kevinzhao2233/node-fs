module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2022: true,
    node: true,
  },
  settings: {
    'import/resolver': {
      node: {
        paths: ['src'],
        extensions: ['.js', '.ts'],
      },
    },
  },
  extends: ['google'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 14,
  },
  plugins: ['@typescript-eslint', 'import', 'simple-import-sort'],
  rules: {
    'max-len': ['error', 140],
    'object-curly-spacing': ['error', 'always', { arraysInObjects: false, objectsInObjects: false }],
    'new-cap': 'off',
    'indent': 'off',
    'no-unused-vars': 'off',
    'camelcase': 'off',

    'import/extensions': [1, 'never'],
    'import/no-unresolved': 'off',
    'import/no-extraneous-dependencies': 'off',
    'import/prefer-default-export': 'off',

    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',

    /**
     * typescript 插件相关的
     */
    '@typescript-eslint/no-unused-vars': ['warn'],
    '@typescript-eslint/member-delimiter-style': [
      'error',
      {
        multiline: {
          delimiter: 'semi',
          requireLast: true,
        },
        singleline: {
          delimiter: 'semi',
          requireLast: false,
        },
        multilineDetection: 'brackets',
      },
    ],
    '@typescript-eslint/indent': ['error', 2],
    // 优先使用 interface 而不是 type
    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
  },
};
