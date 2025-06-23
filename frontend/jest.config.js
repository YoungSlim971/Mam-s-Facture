export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.app.json',
      useESM: true,
    },
  },
  // Babel config is removed as it wasn't solving the import.meta issue correctly
  // and we are now mocking the modules that use import.meta.env.
  testPathIgnorePatterns: [
    "/node_modules/",
    "/tests/e2e/"
  ],
};
