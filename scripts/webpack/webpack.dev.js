'use strict';

const browserslist = require('browserslist');
let commitHash = require('child_process').execSync('git rev-parse --short HEAD').toString().trim();
const { resolveToEsbuildTarget } = require('esbuild-plugin-browserslist');
const ESLintPlugin = require('eslint-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const path = require('path');
const { DefinePlugin, HotModuleReplacementPlugin } = require('webpack');
const { merge } = require('webpack-merge');

const common = require('./webpack.common.js');
const esbuildTargets = resolveToEsbuildTarget(browserslist(), {
  printUnknownTargets: false,
});

// get git info from command line

module.exports = (env = {}) =>
  merge(common, {
    devtool: 'eval-cheap-module-source-map',
    mode: 'development',

    // If we enabled watch option via CLI
    watchOptions: {
      ignored: /node_modules/,
    },

    module: {
      // Note: order is bottom-to-top and/or right-to-left
      rules: [
        {
          test: /\.tsx?$/,
          use: {
            loader: 'esbuild-loader',
            options: {
              loader: 'tsx',
              target: esbuildTargets,
            },
          },
          exclude: /node_modules/,
        },
      ],
    },

    // https://webpack.js.org/guides/build-performance/#output-without-path-info
    output: {
      pathinfo: false,
    },

    // https://webpack.js.org/guides/build-performance/#avoid-extra-optimization-steps
    optimization: {
      moduleIds: 'named',
      runtimeChunk: true,
      removeAvailableModules: false,
      removeEmptyChunks: false,
      splitChunks: false,
    },

    // enable persistent cache for faster cold starts
    cache: {
      type: 'filesystem',
      name: 'velaux-default-development',
      buildDependencies: {
        config: [__filename],
      },
    },

    plugins: [
      parseInt(env.noTsCheck, 10)
        ? new DefinePlugin({}) // bogus plugin to satisfy webpack API
        : new ForkTsCheckerWebpackPlugin({
            async: true, // don't block webpack emit
            typescript: {
              mode: 'write-references',
              memoryLimit: 4096,
              diagnosticOptions: {
                semantic: true,
                syntactic: true,
              },
            },
          }),
      // next major version of ForkTsChecker is dropping support for ESLint
      new ESLintPlugin({
        lintDirtyModulesOnly: true, // don't lint on start, only lint changed files
        extensions: ['.ts', '.tsx'],
      }),
      new DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify('development'),
        },
        __COMMIT_HASH__: JSON.stringify(commitHash),
      }),
      new HotModuleReplacementPlugin(),
    ],
  });
