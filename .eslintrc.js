module.exports = {
  'env': {
    'browser': true,
    'commonjs': true,
    'es2022': true,
    'node': true,
  },
  'settings': {
    'import/resolver': {
      node: {
        paths: ['src'],
        extensions: ['.js', '.ts'],
      },
    },
  },
  'extends': [
    'google',
  ],
  'parser': '@typescript-eslint/parser',
  'parserOptions': {
    'ecmaVersion': 14,
  },
  'plugins': [
    '@typescript-eslint',
    'import',
    'simple-import-sort',
  ],
  'rules': {
    'max-len': ['error', 140],
    'object-curly-spacing': ['error', 'always', { 'arraysInObjects': false, 'objectsInObjects': false }],
    'new-cap': 'off',

    'import/extensions': [1, 'never'],
    'import/no-unresolved': 'off',
    'import/no-extraneous-dependencies': 'off',
    'import/prefer-default-export': 'off',

    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
  },
};
