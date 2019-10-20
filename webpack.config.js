const path = require('path');

let babelOptions;
let filename = '[name].js';
const minify = process.env.BUILD_MODE.endsWith('min');

if (!process.env.BUILD_MODE.startsWith('umd')) {
  // To see es* prefix in webpack stat output, concatenate folder with filename
  filename = `${process.env.BUILD_MODE.match(/^([^-]+)/)[1]}/${filename}`;
}

if (process.env.BUILD_MODE.startsWith('umd')) {
  babelOptions = {
    presets: [
      ['@babel/preset-react', {useBuiltIns: false}],
      ['@babel/preset-env', {loose: true, modules: false}],
    ],
    plugins: [
      ['@babel/plugin-proposal-class-properties', {loose: true}],
      // Optional Chaining Operator: 'user.address?.street'
      ['@babel/plugin-proposal-optional-chaining', {loose: true}],
      // Nullish coalescing: x ?? y
      ['@babel/plugin-proposal-nullish-coalescing-operator', {loose: true}],
      ['transform-react-remove-prop-types', {mode: 'remove', removeImport: true}],
    ],
  };
} else if (process.env.BUILD_MODE.startsWith('es2015')) {
  babelOptions = {
    presets: [
      ['@babel/preset-react', {useBuiltIns: true}],
    ],
    plugins: [
      '@babel/plugin-transform-async-to-generator',
      ['@babel/plugin-proposal-class-properties', {loose: true}],
      ['@babel/plugin-proposal-object-rest-spread', {loose: true, useBuiltIns: true}],
      ['transform-react-remove-prop-types', {mode: 'remove', removeImport: true}],
    ],
  };
} else if (process.env.BUILD_MODE.startsWith('es2017')) {
  babelOptions = {
    presets: [
      ['@babel/preset-react', {useBuiltIns: true}],
    ],
    plugins: [
      ['@babel/plugin-proposal-class-properties', {loose: true}],
      ['@babel/plugin-proposal-object-rest-spread', {loose: true, useBuiltIns: true}],
      ['transform-react-remove-prop-types', {mode: 'remove', removeImport: true}],
    ],
  };
} else if (process.env.BUILD_MODE.startsWith('es2018') || process.env.BUILD_MODE.startsWith('es2019')) {
  babelOptions = {
    presets: [
      ['@babel/preset-react', {useBuiltIns: true}],
    ],
    plugins: [
      ['@babel/plugin-proposal-class-properties', {loose: true}],
      ['transform-react-remove-prop-types', {mode: 'remove', removeImport: true}],
    ],
  };
}

module.exports = {
  entry: {
    [`react-size-watcher${minify ? '.min' : ''}`]: './src/index.js',
  },
  output: {
    filename,
    sourceMapFilename: `${filename}.map`,
    path: path.resolve(__dirname, 'dist'),
    pathinfo: false,
    libraryTarget: 'umd',
    library: 'SizeWatcher',
  },
  devtool: 'source-map',
  mode: 'production',
  optimization: {
    removeAvailableModules: true,
    removeEmptyChunks: true,
    mergeDuplicateChunks: true,
    flagIncludedChunks: true,
    occurrenceOrder: true,
    providedExports: true,
    usedExports: true,
    sideEffects: true,
    concatenateModules: true,
    splitChunks: false,
    runtimeChunk: false,
    noEmitOnErrors: true,
    namedModules: true,
    namedChunks: true,
    nodeEnv: 'production',
    minimize: minify,
  },
  resolve: {
    modules: [
      path.resolve('src'),
      'node_modules',
    ],
  },
  externals: {
    'react': 'umd react',
    'prop-types': {
      amd: 'prop-types',
      root: 'PropTypes',
      commonjs: 'prop-types',
      commonjs2: 'prop-types',
    },
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: babelOptions,
        },
      },
    ],
  },
  node: {
    process: false,
    setImmediate: false,
  },
  stats: {
    assets: true,
    colors: true,
    errors: true,
    errorDetails: true,
    hash: false,
    timings: true,
    version: true,
    warnings: true,
    entrypoints: false,
    modules: false,
  },
};
