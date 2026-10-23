// Gecorrigeerde versie van de config-plugin van react-native-alarm-scheduler 1.0.1:
// het origineel geeft `modResults.manifest` door aan addPermission, waardoor prebuild op Android faalt.
const {
  AndroidConfig,
  IOSConfig,
  withAndroidManifest,
  withInfoPlist,
  withXcodeProject,
} = require('expo/config-plugins');
const path = require('path');

const pakketMap = path.dirname(require.resolve('react-native-alarm-scheduler/package.json'));
const stilGeluid = path.join(pakketMap, 'assets', 'alarm-scheduler-silence.caf');

module.exports = function withAlarmScheduler(config, props = {}) {
  config = withAndroidManifest(config, (modConfig) => {
    const manifest = modConfig.modResults;
    AndroidConfig.Permissions.addPermission(manifest, 'android.permission.SCHEDULE_EXACT_ALARM');
    AndroidConfig.Permissions.addPermission(manifest, 'android.permission.POST_NOTIFICATIONS');
    AndroidConfig.Permissions.addPermission(manifest, 'com.android.alarm.permission.SET_ALARM');
    return modConfig;
  });

  config = withInfoPlist(config, (modConfig) => {
    modConfig.modResults.NSAlarmKitUsageDescription = props.alarmKitUsageDescription;
    modConfig.modResults.NSSupportsLiveActivities = true;
    return modConfig;
  });

  config = withXcodeProject(config, (modConfig) => {
    const project = modConfig.modResults;
    IOSConfig.XcodeUtils.ensureGroupRecursively(project, 'Resources');
    IOSConfig.XcodeUtils.addResourceFileToGroup({
      filepath: path.relative(modConfig.modRequest.platformProjectRoot, stilGeluid),
      groupName: 'Resources',
      project,
      isBuildFile: true,
      verbose: true,
    });
    return modConfig;
  });

  return config;
};
