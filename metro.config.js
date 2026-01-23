const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure proper resolution for AWS SDK and other libraries
config.resolver.assetExts.push('cjs');

module.exports = config;
