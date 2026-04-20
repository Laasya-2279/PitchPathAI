module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      lines: 85,
      functions: 85,
      branches: 75,
      statements: 85
    }
  },
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/__tests__/**/*.test.jsx',
    '**/*.spec.js'
  ],
  setupFilesAfterFramework: ['@testing-library/jest-dom/expect'],
  testTimeout: 15000
};
