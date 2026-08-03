const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // Ignore transient Android native build folders that may appear/disappear during CMake steps.
    blockList: [/android\/app\/\.cxx\/.*/, /android\/app\/build\/.*/, /android\/build\/.*/],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
