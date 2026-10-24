// Native modules die in unit-tests niet bestaan
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Unit-tests controleren de Nederlandse teksten
require('./src/i18n').zetTaal('nl');
