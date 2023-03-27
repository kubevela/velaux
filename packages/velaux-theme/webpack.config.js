'use strict';

const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const CssSplitWebpackPlugin = require('css-split-webpack-plugin').default;
const autoprefixer = require('autoprefixer');
const cssvarFallback = require('postcss-custom-properties');
const calc = require('postcss-calc');
const PnpWebpackPlugin = require('pnp-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const css = (options = {}) => [
  {
    loader: 'style-loader',
  },
  {
    loader: 'css-loader',
    options: {
      minimize: !!options.minimize,
    },
  },
  {
    loader: 'postcss-loader',
    options: {
      plugins: () => [
        autoprefixer({
          browsers: ['last 2 versions', 'Firefox ESR', '> 1%', 'ie >= 9'],
        }),
        calc(),
        cssvarFallback(),
      ],
    },
  },
];

const scss = (options = {}) => [
  ...css(options),
  {
    loader: 'fast-sass-loader',
  },
];

const buildTime = {
  start: new Date().getTime(),
  end: new Date().getTime(),
};

module.exports = function ({ minimize = false }) {
  const config = {
    entry: {
      next: ['./index.scss', './index.js'],
      ['next-noreset']: './index-noreset.scss',
    },
    output: {
      path: path.join(__dirname, 'dist'),
      publicPath: '/dist/',
      library: 'Next',
      libraryTarget: 'umd',
    },
    resolve: {
      extensions: ['.js', '.jsx'],
      plugins: [PnpWebpackPlugin],
    },
    resolveLoader: {
      plugins: [PnpWebpackPlugin.moduleLoader(module)],
    },

    externals: [
      {
        react: {
          root: 'React',
          commonjs2: 'react',
          commonjs: 'react',
          amd: 'react',
        },
      },
      {
        moment: {
          root: 'moment',
          commonjs2: 'moment',
          commonjs: 'moment',
          amd: 'moment',
        },
      },
    ],
    module: {
      rules: [
        {
          test: /\.css$/,
          use: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: css({ minimize }).slice(1),
          }),
        },
        {
          test: /\.scss$/,
          use: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: scss({ minimize }).slice(1),
          }),
        },
      ],
    },
    plugins: [
      new webpack.BannerPlugin(`{{name}}@{{version}} (https://kubevela.net)
{{@alifd/next}}@{{1.26.14}} (https://fusion.design)
Copyright 2023 KubeVela`),
      new webpack.NoEmitOnErrorsPlugin(),
      new webpack.optimize.ModuleConcatenationPlugin(),
      new CaseSensitivePathsPlugin(),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': '"production"',
      }),
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
      new webpack.ProgressPlugin((percentage, msg) => {
        if (percentage === 0) {
          buildTime.start = new Date().getTime();
          console.log('> webpack bundle is start.');
        }
        if (percentage === 1) {
          buildTime.end = new Date().getTime();
          console.log('> webpack bundle is finished. (Spent %s ms)', buildTime.end - buildTime.start);
        }
      }),
    ],
  };

  const { version } = require('@alifd/next/package.json');
  if (version >= '1.21.0') {
    config.entry['next-noreset.var'] = './index-noreset.var.scss';
    config.entry['next.var'] = './index.var.scss';
  }

  if (minimize) {
    config.output.filename = '[name].min.js';
    config.plugins.push(
      new ExtractTextPlugin({
        filename: '[name].min.css',
        allChunks: true,
      })
    );
    config.optimization = {
      minimize: true,
      minimizer: [new TerserPlugin()],
    };
  } else {
    config.output.filename = '[name].js';
    config.plugins.push(
      new ExtractTextPlugin({
        filename: '[name].css',
        allChunks: true,
      })
    );
  }

  config.plugins.push(new CssSplitWebpackPlugin({ size: 4000, preserve: true }));

  return config;
};
