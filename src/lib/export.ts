import { supabase } from '@/lib/supabase';

// Alle gegevens van de ingelogde gebruiker, rechtstreeks uit de database (AVG: recht op inzage)
export async function verzamelMijnGegevens(email: string | undefined): Promise<string> {
  const [profiel, alarmen, sessies, eigen] = await Promise.all([
    supabase.from('profiles').select('*').maybeSingle(),
    supabase.from('alarms').select('*').order('tijd'),
    supabase.from('missie_sessies').select('*').order('afgerond_op', { ascending: false }),
    supabase.from('eigen_missies').select('*').order('created_at'),
  ]);
  const fout = profiel.error ?? alarmen.error ?? sessies.error ?? eigen.error;
  if (fout) throw fout;
  return JSON.stringify(
    {
      app: 'Mooove',
      geexporteerdOp: new Date().toISOString(),
      account: { email },
      profiel: profiel.data,
      alarmen: alarmen.data,
      eigenMissies: eigen.data,
      missies: sessies.data,
    },
    null,
    2,
  );
}
