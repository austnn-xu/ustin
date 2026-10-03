import type { ConfigContext, ExpoConfig } from 'expo/config';

// EXPO_BASE_URL lets the web export run from a subpath (GitHub Pages serves it at /ustin).
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  experiments: {
    ...config.experiments,
    ...(process.env.EXPO_BASE_URL ? { baseUrl: process.env.EXPO_BASE_URL } : null),
  },
});
