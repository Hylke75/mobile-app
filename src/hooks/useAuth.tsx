import type { Session, User } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { t } from '@/i18n';
import { annuleerAlles } from '@/lib/alarmen';
import { annuleerHerinneringen } from '@/lib/herinneringen';
import { leesLokaal, schrijfLokaal, SLEUTELS, wisLokaal } from '@/lib/opslag';
import { supabase } from '@/lib/supabase';
import type { Profiel } from '@/types/database';

type AuthStatus = 'laden' | 'ingelogd' | 'uitgelogd';

type AuthContextWaarde = {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  profiel: Profiel | null;
  // Anoniem account (doorgegaan zonder e-mailadres); kan later een e-mailadres koppelen
  gast: boolean;
  doorgaanZonderAccount: () => Promise<string | null>;
  koppelEmail: (email: string) => Promise<string | null>;
  bevestigKoppeling: (email: string, code: string) => Promise<string | null>;
  vraagCodeAan: (email: string) => Promise<string | null>;
  controleerCode: (email: string, code: string) => Promise<string | null>;
  loginMetWachtwoord: (email: string, wachtwoord: string) => Promise<string | null>;
  slaVoornaamOp: (voornaam: string) => Promise<string | null>;
  werkProfielBij: (
    wijziging: Partial<
      Pick<Profiel, 'voornaam' | 'weekdoel' | 'alarmtest_geslaagd_op' | 'pauze_tot'>
    >,
  ) => Promise<string | null>;
  uitloggen: () => Promise<void>;
  verwijderAccount: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextWaarde | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profiel, setProfiel] = useState<Profiel | null>(null);
  const [laden, setLaden] = useState(true);

  const laadProfiel = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      // Offline: val terug op het laatst bekende profiel van deze gebruiker
      const lokaal = await leesLokaal<Profiel>(SLEUTELS.profiel);
      if (lokaal?.id === userId) setProfiel(lokaal);
      return;
    }
    setProfiel(data);
    await schrijfLokaal(SLEUTELS.profiel, data);
  }, []);

  const profielVan = useRef<string | null>(null);

  useEffect(() => {
    profielVan.current = profiel?.id ?? null;
  }, [profiel]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) {
        const userId = data.session.user.id;
        // Laatst bekende profiel direct gebruiken; vernieuwen gebeurt op de achtergrond
        const lokaal = await leesLokaal<Profiel>(SLEUTELS.profiel);
        if (lokaal?.id === userId) {
          setProfiel(lokaal);
          setLaden(false);
          laadProfiel(userId);
          return;
        }
        await laadProfiel(userId);
      }
      setLaden(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nieuweSession) => {
      setSession(nieuweSession);
      if (!nieuweSession) {
        setProfiel(null);
        return;
      }
      // Bijv. na een tokenverversing nadat de app offline startte: profiel alsnog laden
      if (profielVan.current !== nieuweSession.user.id) {
        const userId = nieuweSession.user.id;
        setTimeout(() => laadProfiel(userId), 0);
      }
    });

    return () => data.subscription.unsubscribe();
  }, [laadProfiel]);

  const vraagCodeAan = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    return error ? vertaalFout(error.message) : null;
  }, []);

  const controleerCode = useCallback(
    async (email: string, code: string) => {
      const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
      if (error || !data.session) return vertaalFout(error?.message);
      await laadProfiel(data.session.user.id);
      return null;
    },
    [laadProfiel],
  );

  // Alleen bedoeld voor het reviewer-account van Apple en Google
  const loginMetWachtwoord = useCallback(
    async (email: string, wachtwoord: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: wachtwoord,
      });
      if (error || !data.session) return t('meldingen.verkeerdWachtwoord');
      await laadProfiel(data.session.user.id);
      return null;
    },
    [laadProfiel],
  );

  const doorgaanZonderAccount = useCallback(async () => {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error || !data.session) return t('meldingen.gastMislukt');
    await laadProfiel(data.session.user.id);
    return null;
  }, [laadProfiel]);

  const koppelEmail = useCallback(async (email: string) => {
    const { error } = await supabase.auth.updateUser({ email });
    if (!error) return null;
    const tekst = error.message.toLowerCase();
    if (tekst.includes('already') || tekst.includes('exists')) return t('meldingen.emailBestaat');
    return vertaalFout(error.message);
  }, []);

  const bevestigKoppeling = useCallback(async (email: string, code: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email_change',
    });
    if (error) return vertaalFout(error.message);
    if (data.session) setSession(data.session);
    else await supabase.auth.refreshSession();
    return null;
  }, []);

  const werkProfielBij = useCallback(
    async (
      wijziging: Partial<
        Pick<Profiel, 'voornaam' | 'weekdoel' | 'alarmtest_geslaagd_op' | 'pauze_tot'>
      >,
    ) => {
      if (!session) return t('meldingen.nietIngelogd');
      const { data, error } = await supabase
        .from('profiles')
        .update(wijziging)
        .eq('id', session.user.id)
        .select()
        .single();
      if (error) return t('meldingen.opslaanMislukt');
      setProfiel(data);
      await schrijfLokaal(SLEUTELS.profiel, data);
      return null;
    },
    [session],
  );

  const slaVoornaamOp = useCallback(
    (voornaam: string) => werkProfielBij({ voornaam }),
    [werkProfielBij],
  );

  const uitloggen = useCallback(async () => {
    await annuleerAlles().catch(() => {});
    await annuleerHerinneringen().catch(() => {});
    await wisLokaal();
    await supabase.auth.signOut();
  }, []);

  const verwijderAccount = useCallback(async () => {
    const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
    if (error) return t('meldingen.verwijderenMislukt');
    await annuleerAlles().catch(() => {});
    await annuleerHerinneringen().catch(() => {});
    await wisLokaal();
    await supabase.auth.signOut({ scope: 'local' });
    return null;
  }, []);

  const status: AuthStatus = laden ? 'laden' : session ? 'ingelogd' : 'uitgelogd';

  return (
    <AuthContext.Provider
      value={{
        status,
        session,
        user: session?.user ?? null,
        profiel,
        gast: session?.user?.is_anonymous === true,
        doorgaanZonderAccount,
        koppelEmail,
        bevestigKoppeling,
        vraagCodeAan,
        controleerCode,
        loginMetWachtwoord,
        slaVoornaamOp,
        werkProfielBij,
        uitloggen,
        verwijderAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function vertaalFout(bericht?: string): string {
  const tekst = (bericht ?? '').toLowerCase();
  if (tekst.includes('expired') || tekst.includes('invalid')) {
    return t('meldingen.codeOngeldig');
  }
  if (tekst.includes('rate') || tekst.includes('seconds')) {
    return t('meldingen.wachtMetCode');
  }
  if (tekst.includes('email')) return t('meldingen.controleerEmail');
  return t('meldingen.ietsMis');
}

export function useAuth(): AuthContextWaarde {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth moet binnen een AuthProvider gebruikt worden.');
  }
  return context;
}
