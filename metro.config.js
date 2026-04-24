const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  'react-native-linear-gradient': require.resolve('expo-linear-gradient'),
};

module.exports = config;
