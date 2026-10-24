import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

export type ToastActie = { label: string; onPress: () => void };

type ToastContextWaarde = {
  toast: string;
  actie: ToastActie | null;
  showToast: (bericht: string, actie?: ToastActie) => void;
  sluitToast: () => void;
};

const ToastContext = createContext<ToastContextWaarde | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState('');
  const [actie, setActie] = useState<ToastActie | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sluitToast = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setToast('');
    setActie(null);
  }, []);

  const showToast = useCallback(
    (bericht: string, nieuweActie?: ToastActie) => {
      if (timer.current) clearTimeout(timer.current);
      setToast(bericht);
      setActie(nieuweActie ?? null);
      // Met een actie (zoals ongedaan maken) blijft de melding langer staan
      timer.current = setTimeout(sluitToast, nieuweActie ? 5000 : 2500);
    },
    [sluitToast],
  );

  return (
    <ToastContext.Provider value={{ toast, actie, showToast, sluitToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextWaarde {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast moet binnen een ToastProvider gebruikt worden.');
  return context;
}
