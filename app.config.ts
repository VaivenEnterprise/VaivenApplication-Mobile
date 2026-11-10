import type { ExpoConfig } from 'expo/config';

// Configuración base de la app. Los identificadores de paquete, permisos y
// plugins nativos los completa la tarea T025.
const config: ExpoConfig = {
  name: 'Vaivén',
  slug: 'vaiven',
  scheme: 'vaiven',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  plugins: ['expo-router'],
  experiments: {
    typedRoutes: true,
  },
  ios: {
    supportsTablet: false,
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#FAF6F0',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
  },
};

export default config;
