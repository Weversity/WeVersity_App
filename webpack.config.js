const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const { DefinePlugin } = require('webpack');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Add this DefinePlugin to your webpack config
  config.plugins.push(
    new DefinePlugin({
      __DEV__: JSON.stringify(env.development),
      'process.env.NODE_ENV': JSON.stringify(env.mode), // Or a specific value like '"development"'
    })
  );

  return config;
};
