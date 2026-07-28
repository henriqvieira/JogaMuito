const path = require('path');

module.exports = {
  projectRoot: __dirname,
  watchFolders: [path.resolve(__dirname)],
  resolver: {
    sourceExts: ['js', 'jsx', 'ts', 'tsx', 'json', 'cjs'],
    nodeModulesPaths: [path.resolve(__dirname, 'node_modules')],
  },
};
