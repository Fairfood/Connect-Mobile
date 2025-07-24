module.exports = {
  preset: 'react-native',
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  setupFiles: ['./__test__/jest/jest.setup.js'],
  testMatch: ['<rootDir>/__test__/jest/**/*.test.js'],
};
