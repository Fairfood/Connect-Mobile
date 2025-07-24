const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @format
 * @type {import('metro-config').MetroConfig}
 */
const config = {};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
