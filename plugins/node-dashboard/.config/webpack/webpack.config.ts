import CopyWebpackPlugin from 'copy-webpack-plugin';
import ESLintPlugin from 'eslint-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import LiveReloadPlugin from 'webpack-livereload-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import path from 'path';
import ReplaceInFileWebpackPlugin from 'replace-in-file-webpack-plugin';
import { Configuration } from 'webpack';

import { getPackageJson, getPluginId, hasReadme, getEntries } from './utils';
import { SOURCE_DIR, DIST_DIR } from './constants';

const config = async (env): Promise<Configuration> => ({
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename],
    },
  },

  context: path.join(process.cwd(), SOURCE_DIR),

  devtool: env.production ? 'source-map' : 'eval-source-map',

  entry: await getEntries(),

  externals: [
    'lodash',
    'moment',
    'react',
    'react-dom',
    'redux',
    'dva/router',
    '@velaux/ui',
    '@velaux/data',

    // Mark legacy SDK imports as external if their name starts with the "velaux/" prefix
    ({ request }, callback) => {
      const prefix = 'velaux/';
      const hasPrefix = (request) => request.indexOf(prefix) === 0;
      const stripPrefix = (request) => request.substr(prefix.length);

      if (hasPrefix(request)) {
        return callback(undefined, stripPrefix(request));
      }

      callback();
    },
  ],

  mode: env.production ? 'production' : 'development',

  module: {
    rules: [
      {
        exclude: /(node_modules)/,
        test: /\.[tj]sx?$/,
        use: {
          loader: 'swc-loader',
          options: {
            jsc: {
              baseUrl: './src',
              target: 'es2015',
              loose: false,
              parser: {
                syntax: 'typescript',
                tsx: true,
                decorators: false,
                dynamicImport: true,
              },
            },
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        exclude: /(node_modules)/,
        test: /\.s[ac]ss$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
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
        test: /\.(png|jpe?g|gif|svg)$/,
        type: 'asset/resource',
        generator: {
          publicPath: `public/plugins/${getPluginId()}/img/`,
          outputPath: 'img/',
          filename: Boolean(env.production) ? '[hash][ext]' : '[name][ext]',
        },
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)(\?v=\d+\.\d+\.\d+)?$/,
        type: 'asset/resource',
        generator: {
          publicPath: `public/plugins/${getPluginId()}/fonts`,
          outputPath: 'fonts/',
          filename: Boolean(env.production) ? '[hash][ext]' : '[name][ext]',
        },
      },
    ],
  },

  output: {
    clean: {
      keep: /gpx_.*/,
    },
    filename: '[name].js',
    library: {
      type: 'amd',
    },
    path: path.resolve(process.cwd(), DIST_DIR),
    publicPath: '/',
  },

  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
    }),
    new CopyWebpackPlugin({
      patterns: [
        // If src/README.md exists use it; otherwise the root README
        // To `compiler.options.output`
        { from: hasReadme() ? 'README.md' : '../README.md', to: '.', force: true },
        { from: 'plugin.json', to: '.' },
        { from: '../LICENSE', to: '.' },
        { from: '../CHANGELOG.md', to: '.', force: true },
        { from: '**/*.json', to: '.' }, // TODO<Add an error for checking the basic structure of the repo>
        { from: '**/*.svg', to: '.', noErrorOnMissing: true }, // Optional
        { from: '**/*.png', to: '.', noErrorOnMissing: true }, // Optional
        { from: '**/*.html', to: '.', noErrorOnMissing: true }, // Optional
        { from: 'img/**/*', to: '.', noErrorOnMissing: true }, // Optional
        { from: 'libs/**/*', to: '.', noErrorOnMissing: true }, // Optional
        { from: 'static/**/*', to: '.', noErrorOnMissing: true }, // Optional
      ],
    }),
    // Replace certain template-variables in the README and plugin.json
    new ReplaceInFileWebpackPlugin([
      {
        dir: DIST_DIR,
        files: ['plugin.json', 'README.md'],
        rules: [
          {
            search: /\%VERSION\%/g,
            replace: getPackageJson().version,
          },
          {
            search: /\%TODAY\%/g,
            replace: new Date().toISOString().substring(0, 10),
          },
          {
            search: /\%PLUGIN_ID\%/g,
            replace: getPluginId(),
          },
        ],
      },
    ]),
    new ForkTsCheckerWebpackPlugin({
      async: Boolean(env.development),
      issue: {
        include: [{ file: '**/*.{ts,tsx}' }],
      },
      typescript: { configFile: path.join(process.cwd(), 'tsconfig.json') },
    }),
    new ESLintPlugin({
      extensions: ['.ts', '.tsx'],
      lintDirtyModulesOnly: Boolean(env.development), // don't lint on start, only lint changed files
    }),
    ...(env.development ? [new LiveReloadPlugin()] : []),
  ],

  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    // handle resolving "rootDir" paths
    modules: [path.resolve(process.cwd(), 'src'), 'node_modules'],
    unsafeCache: true,
  },
});

export default config;
