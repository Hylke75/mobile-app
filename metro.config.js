// Sentry: debug-ID's in de bundle, zodat foutmeldingen naar de juiste coderegel wijzen
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

module.exports = getSentryExpoConfig(__dirname);
