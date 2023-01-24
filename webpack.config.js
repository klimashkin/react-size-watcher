const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

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
      ['@babel/plugin-proposal-optional-chaining', {loose: true}],
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
      ['@babel/plugin-proposal-optional-chaining', {loose: true}],
      ['@babel/plugin-proposal-nullish-coalescing-operator', {loose: true}],
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
      ['@babel/plugin-proposal-optional-chaining', {loose: true}],
      ['@babel/plugin-proposal-nullish-coalescing-operator', {loose: true}],
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
      ['@babel/plugin-proposal-optional-chaining', {loose: true}],
      ['@babel/plugin-proposal-nullish-coalescing-operator', {loose: true}],
      ['transform-react-remove-prop-types', {mode: 'remove', removeImport: true}],
    ],
  };
} else if (process.env.BUILD_MODE.startsWith('es2020') || process.env.BUILD_MODE.startsWith('es2021')) {
  babelOptions = {
    presets: [
      ['@babel/preset-react', {useBuiltIns: true}],
    ],
    plugins: [
      ['@babel/plugin-proposal-class-properties', {loose: true}],
      ['transform-react-remove-prop-types', {mode: 'remove', removeImport: true}],
    ],
  };
} else if (process.env.BUILD_MODE.startsWith('es2022')) {
  babelOptions = {
    presets: [
      ['@babel/preset-react', {useBuiltIns: true}],
    ],
    plugins: [
      ['transform-react-remove-prop-types', {mode: 'remove', removeImport: true}],
    ],
  };
}

const terserOptions = {
  test: /\.js$/i,
  parallel: true,
  extractComments: false,
  terserOptions: {
    keep_classnames: false,
    keep_fnames: false,
    ie8: false,
    nameCache: null,
    safari10: false,
    toplevel: false,
    warnings: false,
    module: false,

    parse: {
      bare_returns: false,
      html5_comments: true,
      shebang: true,
    },
    compress: {
      arrows: false,
      arguments: true,
      booleans: true,
      booleans_as_integers: false,
      collapse_vars: true,
      comparisons: true,
      computed_props: true,
      conditionals: true,
      dead_code: true,
      defaults: true,
      directives: true,
      drop_console: false,
      drop_debugger: true,
      ecma:
        process.env.BUILD_MODE.startsWith('es2015') ? 2015 :
        process.env.BUILD_MODE.startsWith('es2017') ? 2017 :
        process.env.BUILD_MODE.startsWith('es2018') ? 2018 :
        process.env.BUILD_MODE.startsWith('es2019') ? 2019 :
        process.env.BUILD_MODE.startsWith('es2020') ? 2022 :
        process.env.BUILD_MODE.startsWith('es2021') ? 2021 :
        process.env.BUILD_MODE.startsWith('es2022') ? 2022 : 5,
      evaluate: true,
      expression: false,
      global_defs: {},
      hoist_funs: false,
      hoist_props: true,
      hoist_vars: false,
      if_return: true,
      inline: false,
      join_vars: false,
      keep_classnames: false,
      keep_fargs: true,
      keep_fnames: false,
      keep_infinity: true,
      loops: true,
      module: false,
      negate_iife: true,
      passes: 1,
      properties: true,
      pure_funcs: null,
      pure_getters: 'strict',
      reduce_funcs: true,
      reduce_vars: true,
      sequences: true,
      side_effects: true,
      switches: true,
      toplevel: false,
      top_retain: null,
      typeofs: true,
      unsafe: false,
      unsafe_arrows: false,
      unsafe_comps: false,
      unsafe_Function: false,
      unsafe_math: false,
      unsafe_methods: false,
      unsafe_proto: false,
      unsafe_regexp: false,
      unsafe_undefined: false,
      unused: true,
      warnings: true,
    },
    mangle: {
      eval: false,
      keep_classnames: false,
      keep_fnames: false,
      module: false,
      reserved: [],
      toplevel: false,
      safari10: false,
    },
    output: {
      ascii_only: true, // To avoid unicode bugs in Safari, like https://github.com/terser/terser/issues/729
      braces: false,
      comments: false,
      ecma: 6,
      indent_level: 2,
      indent_start: 0,
      inline_script: false,
      keep_numbers: false,
      keep_quoted_props: false,
      max_line_len: 200, // To make devtools responsive, should not be very small to avoid increasing size too much
      preamble: null,
      quote_keys: false,
      quote_style: 3,
      safari10: false,
      semicolons: true,
      shebang: true,
      webkit: false,
      width: 120,
      wrap_iife: false,
    },
  },
};

module.exports = {
  entry: {
    [`react-size-watcher${minify ? '.min' : ''}`]: './src/SizeWatcher.js',
  },
  output: {
    filename,
    sourceMapFilename: `${filename}.map`,
    path: path.resolve(__dirname, 'dist'),
    pathinfo: false,
    library: {
      type: 'umd',
      name: 'SizeWatcher',
    },
  },
  // devtool: 'source-map',
  mode: 'production',
  optimization: {
    minimize: minify,
    minimizer: [new TerserPlugin(terserOptions)],
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
