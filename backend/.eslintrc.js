module.exports = {
  env: { browser: true, es2021: true, node: true, jest: true },
  extends: ['eslint:recommended', 'plugin:react/recommended'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  rules: {
    'no-unused-vars': 'error',
    'no-console': 'warn',
    'no-undef': 'error',
    'react/prop-types': 'warn'
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
};
