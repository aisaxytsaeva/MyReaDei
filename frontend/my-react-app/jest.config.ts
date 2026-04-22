import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.js'
  },
  // ✅ Исключаем e2e и my-react-app/e2e
  testPathIgnorePatterns: [
    '/node_modules/',
    '/e2e/',
    '/my-react-app/e2e/',
    'e2e'
  ],
  // ✅ Указываем только тесты в src
  testMatch: [
    '**/src/**/*.test.{ts,tsx}'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      isolatedModules: true
    }]
  }
};

export default config;