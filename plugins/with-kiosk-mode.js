const { withAndroidManifest } = require('@expo/config-plugins');

function withKioskMode(config) {
  return withAndroidManifest(config, (configResult) => {
    const manifest = configResult.modResults;
    const application = manifest.manifest.application?.[0];

    if (!application) {
      return configResult;
    }

    const mainActivity = application.activity?.find(
      (activity) =>
        activity?.$?.['android:name'] === '.MainActivity' ||
        activity?.$?.['android:name'] === 'com.facebook.react.defaults.DefaultNewArchitectureEntryPoint'
    ) || application.activity?.[0];

    if (!mainActivity || !mainActivity.$) {
      return configResult;
    }

    // Let Android allow lock task mode for this activity when the app is whitelisted.
    mainActivity.$['android:lockTaskMode'] = 'if_whitelisted';

    return configResult;
  });
}

module.exports = withKioskMode;
