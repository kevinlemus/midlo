const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Improve module resolution with pnpm/workspaces
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
