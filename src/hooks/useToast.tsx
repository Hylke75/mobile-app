import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

type ToastContextWaarde = {
  toast: string;
  showToast: (bericht: string) => void;
};

const ToastContext = createContext<ToastContextWaarde | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((bericht: string) => {
    if (timer.current) clearTimeout(timer.current);
    setToast(bericht);
    timer.current = setTimeout(() => setToast(''), 2500);
  }, []);

  return <ToastContext.Provider value={{ toast, showToast }}>{children}</ToastContext.Provider>;
}

export function useToast(): ToastContextWaarde {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast moet binnen een ToastProvider gebruikt worden.');
  return context;
}
