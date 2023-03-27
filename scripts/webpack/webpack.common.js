const CopyPlugin = require('copy-webpack-plugin');
const browserslist = require('browserslist');
const { resolveToEsbuildTarget } = require('esbuild-plugin-browserslist');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { ProvidePlugin } = require('webpack');
const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CorsWorkerPlugin = require('./plugins/CorsWorkerPlugin');
const esbuildTargets = resolveToEsbuildTarget(browserslist(), { printUnknownTargets: false });

module.exports = {
  target: 'web',
  entry: {
    app: './packages/velaux-ui/src/index.ts',
    default: './packages/velaux-ui/src/theme-default.less',
  },
  output: {
    clean: true,
    path: path.resolve(__dirname, '../../public/build'),
    filename: '[name].[contenthash].js',
    publicPath: '/public/build/',
    globalObject: 'this',
  },
  externals: {},
  resolve: {
    extensions: ['.ts', '.tsx', '.es6', '.js', '.json', '.svg'],
    modules: ['node_modules', path.resolve('public')],

    fallback: {
      buffer: false,
      fs: false,
      stream: false,
      http: false,
      https: false,
      string_decoder: false,
    },
    symlinks: false,
  },
  ignoreWarnings: [/export .* was not found in/],
  stats: {
    children: false,
    source: false,
  },
  plugins: [
    new CorsWorkerPlugin(),
    new ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
    new MiniCssExtractPlugin({
      filename: 'velaux.[name].[contenthash].css',
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, '../../packages/velaux-ui/public/index.html'),
      inject: true,
    }),
    new InterpolateHtmlPlugin(HtmlWebpackPlugin, {
      PUBLIC_URL: '/public/build',
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, '../../packages/velaux-ui/public'),
          to: path.resolve(__dirname, '../../public/build'),
          filter: (filepath) => {
            if (filepath.indexOf('index.html') > -1) {
              return false;
            }
            return true;
          },
        },
      ],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(svg|ico|jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|cur|ani|pdf)(\?.*)?$/,
        type: 'asset/resource',
        generator: { filename: 'static/img/[name].[hash:8][ext]' },
      },
      // for pre-caching SVGs as part of the JS bundles
      {
        test: /(unicons|mono|custom)[\\/].*\.svg$/,
        type: 'asset/source',
      },
      {
        test: /\.less$/,
        exclude: /node_modules/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
          },
          {
            loader: 'less-loader',
          },
        ],
      },
      {
        test: /\.(ts|tsx)$/,
        use: [
          {
            loader: 'esbuild-loader',
            options: {
              loader: 'tsx',
              target: esbuildTargets,
            },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  // https://webpack.js.org/plugins/split-chunks-plugin/#split-chunks-example-3
  optimization: {
    runtimeChunk: 'single',
    splitChunks: {
      chunks: 'all',
      minChunks: 1,
      cacheGroups: {
        unicons: {
          test: /[\\/]node_modules[\\/]@iconscout[\\/]react-unicons[\\/].*[jt]sx?$/,
          chunks: 'initial',
          priority: 20,
          enforce: true,
        },
        moment: {
          test: /[\\/]node_modules[\\/]moment[\\/].*[jt]sx?$/,
          chunks: 'initial',
          priority: 20,
          enforce: true,
        },
        angular: {
          test: /[\\/]node_modules[\\/]angular[\\/].*[jt]sx?$/,
          chunks: 'initial',
          priority: 50,
          enforce: true,
        },
        defaultVendors: {
          test: /[\\/]node_modules[\\/].*[jt]sx?$/,
          chunks: 'initial',
          priority: -10,
          reuseExistingChunk: true,
          enforce: true,
        },
        default: {
          priority: -20,
          chunks: 'all',
          test: /.*[jt]sx?$/,
          reuseExistingChunk: true,
        },
      },
    },
  },
};
