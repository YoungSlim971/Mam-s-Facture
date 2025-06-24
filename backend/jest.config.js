module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 300000,
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
