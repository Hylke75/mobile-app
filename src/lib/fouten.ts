import * as Sentry from '@sentry/react-native';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

// Crashrapporten zonder persoonsgegevens; alleen actief als er een DSN is ingesteld
export function startFoutrapportage(): void {
  if (!dsn) return;
  Sentry.init({
    dsn,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    environment: __DEV__ ? 'development' : 'production',
    beforeSend(event) {
      // Geen e-mailadressen of IP-adressen meesturen
      delete event.user;
      return event;
    },
  });
}

export function meldFout(fout: unknown): void {
  if (dsn) Sentry.captureException(fout);
}
