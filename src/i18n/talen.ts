export const TALEN = ['nl', 'en', 'es', 'de', 'fr', 'zh'] as const;
export type Taal = (typeof TALEN)[number];

// Naam van elke taal in die taal zelf, voor de taalkeuze
export const TAALNAMEN: Record<Taal, string> = {
  nl: 'Nederlands',
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
  fr: 'Français',
  zh: '中文',
};

// Voor datums, getallen en de stem van de coach
export const LOCALES: Record<Taal, string> = {
  nl: 'nl-NL',
  en: 'en-US',
  es: 'es-ES',
  de: 'de-DE',
  fr: 'fr-FR',
  zh: 'zh-CN',
};

export function isTaal(waarde: unknown): waarde is Taal {
  return typeof waarde === 'string' && (TALEN as readonly string[]).includes(waarde);
}

// Elke vertaling moet precies dezelfde sleutels hebben als de Nederlandse bron
export type Vorm<T> = { [K in keyof T]: T[K] extends string ? string : Vorm<T[K]> };
export type Vertalingen<T> = { nl: T } & Record<Exclude<Taal, 'nl'>, Vorm<T>>;
