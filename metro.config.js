const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = {
  ...config,
  resolver: {
    ...config.resolver,
    unstable_enablePackageExports: true,
    unstable_enableTransformations: true,
    unstable_disableSymlinks: false,
    unstable_enableBridgeless: false,
  },
}; 