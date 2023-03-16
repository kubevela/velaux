'use strict';

const browserslist = require('browserslist');
let commitHash = require('child_process').execSync('git rev-parse --short HEAD').toString().trim();
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { ESBuildMinifyPlugin } = require('esbuild-loader');
const { resolveToEsbuildTarget } = require('esbuild-plugin-browserslist');
const path = require('path');
const { DefinePlugin } = require('webpack');
const { merge } = require('webpack-merge');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const common = require('./webpack.common.js');
const esbuildTargets = resolveToEsbuildTarget(browserslist(), {
  printUnknownTargets: false,
});

// get git info from command line

module.exports = (env = {}) =>
  merge(common, {
    mode: 'production',
    devtool: 'source-map',

    module: {
      // Note: order is bottom-to-top and/or right-to-left
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'esbuild-loader',
            options: {
              loader: 'tsx',
              target: esbuildTargets,
            },
          },
        },
      ],
    },
    optimization: {
      nodeEnv: 'production',
      minimize: parseInt(env.noMinify, 10) !== 1,
      minimizer: [
        new ESBuildMinifyPlugin({
          target: esbuildTargets,
        }),
        new CssMinimizerPlugin(),
      ],
    },

    // enable persistent cache for faster builds
    cache: {
      type: 'filesystem',
      name: 'velaux-default-production',
      buildDependencies: {
        config: [__filename],
      },
    },

    plugins: [
      new DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify('production'),
        },
        __COMMIT_HASH__: JSON.stringify(commitHash),
      }),
      new WebpackManifestPlugin({
        fileName: path.join(process.cwd(), 'public', 'build', 'manifest.json'),
        filter: (file) => !file.name.endsWith('.map'),
      }),
      function () {
        this.hooks.done.tap('Done', function (stats) {
          if (stats.compilation.errors && stats.compilation.errors.length) {
            console.log(stats.compilation.errors);
            process.exit(1);
          }
        });
      },
    ],
  });
