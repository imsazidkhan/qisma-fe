const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver = {
  ...config.resolver,
  unstable_enablePackageExports: true,
};

const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
  config.transformer = {
    ...config.transformer,
    minifierPath: require.resolve('metro-minify-terser'),
    minifierConfig: {
      ecma: 2020,
      keep_classnames: false,
      keep_fnames: false,
      module: true,
      mangle: { toplevel: true },
      compress: {
        passes: 2,
        drop_console: true,
        pure_funcs: ['console.debug', 'console.info'],
      },
    },
  };
}

module.exports = withNativeWind(config, {
  input: './global.css',
  disableTypeScriptGeneration: true,
});
