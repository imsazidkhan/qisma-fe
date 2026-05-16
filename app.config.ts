import fs from 'node:fs';
import path from 'node:path';

import type { ConfigContext, ExpoConfig } from 'expo/config';

const HOT_UPDATER_BASE_URL = process.env.EXPO_PUBLIC_HOT_UPDATER_BASE_URL;
const HOT_UPDATER_CHANNEL = process.env.EXPO_PUBLIC_HOT_UPDATER_CHANNEL ?? 'production';

export default ({ config }: ConfigContext): ExpoConfig => {
  const root = __dirname;
  const googlePlist = path.join(root, 'GoogleService-Info.plist');
  const googleJson = path.join(root, 'google-services.json');
  const hasFirebase = fs.existsSync(googlePlist) || fs.existsSync(googleJson);

  const plugins: NonNullable<ExpoConfig['plugins']> = [
    'expo-router',
    'expo-secure-store',
    [
      'expo-image-picker',
      {
        photosPermission: 'Allow access to your photo library to set a profile picture.',
      },
    ],
    [
      'expo-contacts',
      {
        contactsPermission:
          'Allow Qisma to access your contacts to find friends you can invite to your group.',
      },
    ],
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
        dark: { backgroundColor: '#000000' },
      },
    ],
  ];

  if (hasFirebase) {
    plugins.push('@react-native-firebase/app');
  }

  if (HOT_UPDATER_BASE_URL) {
    plugins.push(['@hot-updater/react-native', { channel: HOT_UPDATER_CHANNEL }]);
  }

  // HTTP to a dev auth server on device/emulator (Android blocks cleartext by default in release).
  plugins.push(require('./plugins/withAndroidCleartextTraffic'));

  return {
    ...config,
    name: 'Qisma',
    slug: 'qisma',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    /** Universal / custom scheme links, e.g. `qisma://groups/<uuid>/invite` → `app/groups/[groupId]/invite`. */
    scheme: 'qisma',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    jsEngine: 'hermes',
    ios: {
      ...config.ios,
      bundleIdentifier: 'com.imsazid.qisma',
      supportsTablet: true,
      ...(fs.existsSync(googlePlist) ? { googleServicesFile: googlePlist } : {}),
    },
    android: {
      ...config.android,
      package: 'com.imsazid.qisma',
      adaptiveIcon: {
        backgroundColor: '#000000',
        foregroundImage: './assets/images/android-icon-foreground.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      edgeToEdgeEnabled: true,
      /** Lets the root view shrink when the IME opens so pinned footers (e.g. Send OTP) stay above the keyboard. */
      softwareKeyboardLayoutMode: 'resize',
      predictiveBackGestureEnabled: false,
      ...(fs.existsSync(googleJson) ? { googleServicesFile: googleJson } : {}),
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
      bundler: 'metro',
    },
    plugins,
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      ...config.extra,
      eas: {
        projectId: 'd226393c-cd8f-4596-866d-e86690632b6d',
      },
      router: {
        root: 'src/app',
      },
    },
  };
};
