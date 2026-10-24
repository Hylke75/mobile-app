import { huidigeLocale } from '@/i18n';

// Bijvoorbeeld "VRIJDAG 23 OKTOBER" (in de gekozen taal)
export function datumKicker(datum = new Date()): string {
  return datum
    .toLocaleDateString(huidigeLocale(), { weekday: 'long', day: 'numeric', month: 'long' })
    .replace(/,/g, '')
    .toLocaleUpperCase(huidigeLocale());
}
