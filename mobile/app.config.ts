import type { ConfigContext, ExpoConfig } from 'expo/config';

// EXPO_BASE_URL lets the web export run from a subpath (the custom domain serves it at the root; set EXPO_BASE_URL only for a subpath host).
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  experiments: {
    ...config.experiments,
    ...(process.env.EXPO_BASE_URL ? { baseUrl: process.env.EXPO_BASE_URL } : null),
  },
});
