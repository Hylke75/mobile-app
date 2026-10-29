// Native modules die in unit-tests niet bestaan
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Unit-tests controleren de Nederlandse teksten
require('./src/i18n').zetTaal('nl');

// Sentry is ESM en in tests niet nodig: foutrapporten worden niet verstuurd
jest.mock('@sentry/react-native', () => ({ init: jest.fn(), captureException: jest.fn() }));
