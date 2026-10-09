/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  transform: {
    '^.+\\.tsx?$': '<rootDir>/jest.import-meta.transformer.cjs',
  },
  moduleNameMapper: {
    '\\.(css|less)$': '<rootDir>/src/__tests__/styleMock.cjs',
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  transformIgnorePatterns: ['/node_modules/(?!.*)'],
}
