import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/TabBar';

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Vandaag' }} />
      <Tabs.Screen name="alarmen" options={{ title: 'Alarmen' }} />
      <Tabs.Screen name="progressie" options={{ title: 'Progressie' }} />
      <Tabs.Screen name="profiel" options={{ title: 'Profiel' }} />
      <Tabs.Screen name="coach" options={{ title: 'Mooove Coach' }} />
    </Tabs>
  );
}
