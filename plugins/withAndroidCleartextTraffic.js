const { withAndroidManifest } = require('@expo/config-plugins');
const Manifest = require('@expo/config-plugins/build/android/Manifest');

/**
 * Allow HTTP (cleartext) for dev APIs on Android 9+ release builds.
 * @param {import('@expo/config').ExpoConfig} config
 */
module.exports = function withAndroidCleartextTraffic(config) {
  return withAndroidManifest(config, async (cfg) => {
    const app = Manifest.getMainApplicationOrThrow(cfg.modResults);
    app.$['android:usesCleartextTraffic'] = 'true';
    return cfg;
  });
};
