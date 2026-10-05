const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Support Firebase JS SDK and modern packages
config.resolver.sourceExts.push('cjs', 'mjs');

module.exports = config;
