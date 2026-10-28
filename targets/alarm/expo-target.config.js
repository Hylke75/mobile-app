// Live Activity voor AlarmKit: zonder deze widget-extensie kan iOS alarmen met een aftelling
// (snooze, opnieuw afgaan na Stop, uitstel tijdens de missie) onverwacht wegklikken.
/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = () => ({
  type: 'widget',
  name: 'MoooveAlarm',
  displayName: 'Mooove',
  bundleIdentifier: '.alarm',
  deploymentTarget: '26.0',
  frameworks: ['SwiftUI', 'WidgetKit', 'ActivityKit', 'AlarmKit'],
  colors: {
    $accent: '#D9F36B',
  },
});
