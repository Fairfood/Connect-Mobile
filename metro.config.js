const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @format
 * @type {import('metro-config').MetroConfig}
 */
const config = {};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
