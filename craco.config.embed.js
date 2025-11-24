const webpack = require('webpack');
const { ModuleFederationPlugin } = require('webpack').container;
const deps = require('./package.json').dependencies;

// This is a whitelabel embed package - always build in embed mode
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Add buffer polyfill (existing requirement)
      webpackConfig.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
        })
      );

      // Add Module Federation (always enabled for whitelabel embed)
      webpackConfig.plugins.push(
        new ModuleFederationPlugin({
            name: 'projectDashboard',
            filename: 'remoteEntry.js',
            exposes: {
              './DashboardCore': './src/embed/DashboardCore',
              './DashboardProvider': './src/embed/DashboardProvider',
              './theme': './src/theme',
            },
            shared: {
              react: {
                singleton: true,
                requiredVersion: deps.react,
                eager: false,
              },
              'react-dom': {
                singleton: true,
                requiredVersion: deps['react-dom'],
                eager: false,
              },
              '@mui/material': {
                singleton: true,
                requiredVersion: deps['@mui/material'],
                eager: false,
              },
              '@mui/icons-material': {
                singleton: true,
                requiredVersion: deps['@mui/icons-material'],
                eager: false,
              },
              '@emotion/react': {
                singleton: true,
                requiredVersion: deps['@emotion/react'],
                eager: false,
              },
              '@emotion/styled': {
                singleton: true,
                requiredVersion: deps['@emotion/styled'],
                eager: false,
              },
              'react-router-dom': {
                singleton: true,
                requiredVersion: deps['react-router-dom'],
                eager: false,
              },
              axios: {
                singleton: true,
                requiredVersion: deps.axios,
                eager: false,
              },
            },
          })
        );

      // Optimize output for embedding
      webpackConfig.output = {
        ...webpackConfig.output,
        publicPath: 'auto',
        uniqueName: 'projectDashboard',
        chunkLoadingGlobal: 'webpackChunk_projectDashboard',
      };

      // Disable code splitting for simpler integration
      webpackConfig.optimization = {
        ...webpackConfig.optimization,
        splitChunks: false,
        runtimeChunk: false,
      };

      return webpackConfig;
    },
  },
};
