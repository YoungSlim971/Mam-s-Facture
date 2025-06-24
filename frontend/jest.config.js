export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  testTimeout: 300000,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: './tsconfig.app.json',
        useESM: true,
      },
    ],
  },
  // Babel config is removed as it wasn't solving the import.meta issue correctly
  // and we are now mocking the modules that use import.meta.env.
  testPathIgnorePatterns: [
    "/node_modules/",
    "/tests/e2e/"
  ],
};
