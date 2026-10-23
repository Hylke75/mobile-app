import type { Session, User } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { supabase } from '@/lib/supabase';
import type { Profiel } from '@/types/database';

type AuthStatus = 'laden' | 'ingelogd' | 'uitgelogd';

type AuthContextWaarde = {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  profiel: Profiel | null;
  vraagCodeAan: (email: string) => Promise<string | null>;
  controleerCode: (email: string, code: string) => Promise<string | null>;
  loginMetWachtwoord: (email: string, wachtwoord: string) => Promise<string | null>;
  slaVoornaamOp: (voornaam: string) => Promise<string | null>;
  werkProfielBij: (
    wijziging: Partial<Pick<Profiel, 'voornaam' | 'weekdoel' | 'alarmtest_geslaagd_op'>>,
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
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    setProfiel(data);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) await laadProfiel(data.session.user.id);
      setLaden(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nieuweSession) => {
      setSession(nieuweSession);
      if (!nieuweSession) setProfiel(null);
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
      if (error || !data.session) return 'E-mailadres of wachtwoord klopt niet.';
      await laadProfiel(data.session.user.id);
      return null;
    },
    [laadProfiel],
  );

  const werkProfielBij = useCallback(
    async (
      wijziging: Partial<Pick<Profiel, 'voornaam' | 'weekdoel' | 'alarmtest_geslaagd_op'>>,
    ) => {
      if (!session) return 'Je bent niet ingelogd.';
      const { data, error } = await supabase
        .from('profiles')
        .update(wijziging)
        .eq('id', session.user.id)
        .select()
        .single();
      if (error) return 'Opslaan is niet gelukt. Probeer het opnieuw.';
      setProfiel(data);
      return null;
    },
    [session],
  );

  const slaVoornaamOp = useCallback(
    (voornaam: string) => werkProfielBij({ voornaam }),
    [werkProfielBij],
  );

  const uitloggen = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const verwijderAccount = useCallback(async () => {
    const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
    if (error) return 'Verwijderen is niet gelukt. Probeer het later opnieuw.';
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
    return 'Deze code klopt niet of is verlopen.';
  }
  if (tekst.includes('rate') || tekst.includes('seconds')) {
    return 'Even wachten voordat je een nieuwe code aanvraagt.';
  }
  if (tekst.includes('email')) return 'Controleer je e-mailadres.';
  return 'Er ging iets mis. Probeer het opnieuw.';
}

export function useAuth(): AuthContextWaarde {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth moet binnen een AuthProvider gebruikt worden.');
  }
  return context;
}
