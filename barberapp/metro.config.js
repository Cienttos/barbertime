const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add 'mjs' to the source extensions to support modules that use it.
config.resolver.sourceExts.push('mjs');

// Enable symlinks and package exports for better compatibility.
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
