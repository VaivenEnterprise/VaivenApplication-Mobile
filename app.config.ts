import type { ExpoConfig } from 'expo/config';

// Identificador de paquete PROVISIONAL (spec 002, RF-S1): se confirma antes de publicar (spec 013).
const APP_ID = 'mx.vaiven.app';

// Permisos declarados desde ahora (plan P-S2) para no tocar este archivo en cada feature.
// Cada texto explica en español para qué se usa; la ubicación es solo aproximada (Art. VIII.4).
const config: ExpoConfig = {
  name: 'Vaivén',
  slug: 'vaiven',
  scheme: 'vaiven',
  // Versión: 0.1.0 (spec 013-T001) → 1.0.0 → 1.1.0 (IA y ML) → 1.1.1 (D-226, pruebas 016) →
  // 1.1.2 (D-227): reconstrucción con la URL de la API corregida (:8443) para volver a subir a Play.
  version: '1.1.2',
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
        // Spec 021-T012 (RF-11): `false` quita `NSMicrophoneUsageDescription` del Info.plist de iOS.
        microphonePermission: false,
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Vaivén usa tu ubicación aproximada para mostrarte objetos cerca de ti.',
        // Spec 021-T012 (RF-11): sin ubicación «siempre» en iOS; `false` quita las claves
        // `NSLocationAlways*` que el plugin agrega por defecto.
        locationAlwaysPermission: false,
        locationAlwaysAndWhenInUsePermission: false,
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
    // Spec 021-T015 (RF-14): biometría opcional para volver a entrar tras el cierre por inactividad.
    [
      'expo-local-authentication',
      {
        faceIDPermission:
          'Vaivén usa Face ID para confirmar que eres tú al volver a entrar, solo si lo activas.',
      },
    ],
    // Spec 021-T016 (RF-15): R8 (minificación y ofuscación) y recorte de recursos en las
    // compilaciones *release* de Android: el AAB `production` y también el APK `preview`, para que
    // el de prueba valide lo mismo que va a Play. Solo afecta a la compilación nativa (EAS Build),
    // no a Expo Go. Pinning, root y Play Integrity: excepción formal en `docs/calidad/seguridad-nivel.md`.
    [
      'expo-build-properties',
      {
        android: {
          enableMinifyInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
        },
      },
    ],
    // Pantalla de inicio (spec 012 T005): fondo crema de la marca, el mismo del ícono adaptable.
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#FAF6F0',
      },
    ],
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
    // Spec 021-T012 (RF-11): sin copia de seguridad automática de los datos de la app.
    allowBackup: false,
    // Solo ubicación aproximada: nunca se pide la precisa. Los otros tres los traen dependencias
    // al manifiesto efectivo aunque la app no los usa (auditoría 2026-11-26, M-5).
    blockedPermissions: [
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
    ],
    adaptiveIcon: {
      backgroundColor: '#FAF6F0',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
  },
};

export default config;
