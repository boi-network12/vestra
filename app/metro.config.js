const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Add SVG support
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};

// Add Lottie and JSON support
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'lottie',
  'json',
];

// Apply NativeWind configuration
module.exports = withNativeWind(config, {
  input: './global.css',
  postcss: {
    plugins: [require('tailwindcss'), require('autoprefixer')],
  },
});