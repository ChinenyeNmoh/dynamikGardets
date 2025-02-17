import { defaults } from 'jest-config';

export default {
  ...defaults,
  preset: 'ts-jest',

  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  testMatch: [
    '**/src/__test__/**/*.test.ts', // Include your specific test folder and file pattern
    '**/__tests__/**/*.test.ts',    // Keep the default Jest pattern
  ],
};
