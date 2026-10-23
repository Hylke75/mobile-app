import type { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { supabase } from '@/lib/supabase';

type AuthStatus = 'laden' | 'ingelogd' | 'uitgelogd';

type AuthContextWaarde = {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
};

const AuthContext = createContext<AuthContextWaarde | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [laden, setLaden] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLaden(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nieuweSession) => {
      setSession(nieuweSession);
      setLaden(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const status: AuthStatus = laden ? 'laden' : session ? 'ingelogd' : 'uitgelogd';

  return (
    <AuthContext.Provider value={{ status, session, user: session?.user ?? null }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextWaarde {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth moet binnen een AuthProvider gebruikt worden.');
  }
  return context;
}
