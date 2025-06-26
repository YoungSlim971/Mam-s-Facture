module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 300000,
  // Run tests sequentially because they operate on the same SQLite database
  // and profile files. Running in parallel caused race conditions where the
  // database would be seeded multiple times leading to failing expectations.
  maxWorkers: 1,
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: './tsconfig.json',
        diagnostics: false,
      },
    ],
  },
};
