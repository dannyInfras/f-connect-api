module.exports = {
  root: true,
  ignorePatterns: [
    'dist/**/*',
    'node_modules/**/*',
    'src/shared/logger/pino-logger.config.ts',
  ],
  env: {
    node: true,
    jest: true,
  },
  plugins: ['@typescript-eslint/eslint-plugin', 'simple-import-sort'],
  extends: [
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'simple-import-sort/imports': 'error',
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx', 'src/**/*', 'test/**/*'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module',
      },
    },
    {
      files: [
        '**/__tests__/**/*',
        '**/test-utils/**/*',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/jest.setup.js',
        '**/jest.config.js',
        'test/**/*',
        'test/**/*.ts',
        'test/**/*.js',
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-require-imports': 'off',
        'react-hooks/rules-of-hooks': 'off',
        'react-hooks/exhaustive-deps': 'off',
        'no-console': 'off',
        'prefer-const': 'off',
        'no-var': 'off',
      },
    },
  ],
};
