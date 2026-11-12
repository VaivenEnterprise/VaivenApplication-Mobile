import type { ExpoConfig } from 'expo/config';

// Identificador de paquete PROVISIONAL (spec 002, RF-S1): se confirma antes de publicar (spec 013).
const APP_ID = 'mx.vaiven.app';

// Permisos declarados desde ahora (plan P-S2) para no tocar este archivo en cada feature.
// Cada texto explica en español para qué se usa; la ubicación es solo aproximada (Art. VIII.4).
const config: ExpoConfig = {
  name: 'Vaivén',
  slug: 'vaiven',
  scheme: 'vaiven',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  plugins: [
    'expo-router',
    [
      'expo-camera',
      {
        cameraPermission:
          'Vaivén usa la cámara para escanear códigos QR y tomar fotos de tus objetos.',
        recordAudioAndroid: false,
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Vaivén usa tu ubicación aproximada para mostrarte objetos cerca de ti.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'Vaivén accede a tus fotos para que elijas las imágenes de tus objetos.',
        cameraPermission: 'Vaivén usa la cámara para que tomes fotos de tus objetos.',
        microphonePermission: false,
      },
    ],
    'expo-notifications',
  ],
  // Identificador público del proyecto en EAS (no es un secreto).
  extra: {
    eas: { projectId: '8deada84-79bf-4146-a4c4-479561f7d2ad' },
  },
  experiments: {
    typedRoutes: true,
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: APP_ID,
  },
  android: {
    package: APP_ID,
    // Solo ubicación aproximada: nunca se pide la precisa.
    blockedPermissions: ['android.permission.ACCESS_FINE_LOCATION'],
    adaptiveIcon: {
      backgroundColor: '#FAF6F0',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
  },
};

export default config;
