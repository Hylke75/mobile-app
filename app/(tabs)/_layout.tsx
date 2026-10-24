import { router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useEffect } from 'react';

import { TabBar } from '@/components/TabBar';
import { leesLokaal, SLEUTELS } from '@/lib/opslag';

export default function TabsLayout() {
  // Eenmalig per toestel: rechten en batterij klaarzetten
  useEffect(() => {
    leesLokaal<boolean>(SLEUTELS.klaargezet).then((klaar) => {
      if (!klaar) router.push('/klaarzetten');
    });
  }, []);

  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Vandaag' }} />
      <Tabs.Screen name="alarmen" options={{ title: 'Alarmen' }} />
      <Tabs.Screen name="progressie" options={{ title: 'Progressie' }} />
      <Tabs.Screen name="profiel" options={{ title: 'Profiel' }} />
    </Tabs>
  );
}
