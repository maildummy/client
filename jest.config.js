/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      { tsconfig: './configs/tsconfig.test.json' },
    ],
  },
  coverageReporters: ['lcov', 'html'],
};