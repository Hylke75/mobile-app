import { router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useEffect } from 'react';

import { TabBar } from '@/components/TabBar';
import { useTaal } from '@/i18n';
import { leesLokaal, SLEUTELS } from '@/lib/opslag';

export default function TabsLayout() {
  const { t } = useTaal();
  // Eenmalig per toestel: rechten en batterij klaarzetten
  useEffect(() => {
    leesLokaal<boolean>(SLEUTELS.klaargezet).then((klaar) => {
      if (!klaar) router.push('/klaarzetten');
    });
  }, []);

  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: t('navigatie.tabs.vandaag') }} />
      <Tabs.Screen name="alarmen" options={{ title: t('navigatie.tabs.alarmen') }} />
      <Tabs.Screen name="progressie" options={{ title: t('navigatie.tabs.progressie') }} />
      <Tabs.Screen name="profiel" options={{ title: t('navigatie.tabs.profiel') }} />
    </Tabs>
  );
}
