// Design tokens uit docs/ontwerp/prototype/styles.css
export const kleuren = {
  ink: '#101714',
  ink2: '#1B2520',
  lime: '#D8FB59',
  paper: '#F3F3ED',
  white: '#FFFFFF',
  muted: '#7E8982',
  line: '#E4E7DD',
  ice: '#D9EDEE',
  coral: '#FF785B',
} as const;

export const fonts = {
  head400: 'SpaceGrotesk_400Regular',
  head500: 'SpaceGrotesk_500Medium',
  head600: 'SpaceGrotesk_600SemiBold',
  head700: 'SpaceGrotesk_700Bold',
  body400: 'DMSans_400Regular',
  body500: 'DMSans_500Medium',
  body600: 'DMSans_600SemiBold',
  body700: 'DMSans_700Bold',
  body800: 'DMSans_800ExtraBold',
} as const;

// CSS-letterspacing in em omrekenen naar React Native-punten
export const em = (waarde: number, fontSize: number) => waarde * fontSize;

// Thema's: de lichte kleuren zijn het ontwerp; de donkere worden daarvan afgeleid.
export type ThemaNaam = 'licht' | 'donker';

export type Kleuren = {
  // Zelfde sleutels als `kleuren`, maar per thema
  ink: string;
  ink2: string;
  lime: string;
  paper: string;
  white: string;
  muted: string;
  line: string;
  ice: string;
  coral: string;
  // Tekst op limegroen en andere vaste lichte vlakken: altijd donker
  opLime: string;
  // Donkere kaarten en knoppen (in donker iets lichter dan de achtergrond)
  donkerVlak: string;
  // Tekst op donkere vlakken: altijd licht
  opDonker: string;
  // Lichte tint uit het ontwerp → passend vlak, tekstkleur of rand in dit thema
  vlak: (hex: string) => string;
  tint: (hex: string) => string;
  rand: (hex: string) => string;
};

function naarHsl(hex: string): [number, number, number] {
  const n = hex.replace('#', '');
  const v = n.length === 3 ? n.replace(/./g, (c) => c + c) : n.slice(0, 6);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255) as [
    number,
    number,
    number,
  ];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h =
    max === r
      ? ((g - b) / d + (g < b ? 6 : 0)) / 6
      : max === g
        ? ((b - r) / d + 2) / 6
        : ((r - g) / d + 4) / 6;
  return [h, s, l];
}

function naarHex(h: number, s: number, l: number): string {
  const k = (n: number) => (n + h * 12) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return `#${[0, 8, 4]
    .map((n) =>
      Math.round(f(n) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

const zelfde = (hex: string) => hex;

export const LICHT: Kleuren = {
  ...kleuren,
  opLime: kleuren.ink,
  donkerVlak: kleuren.ink,
  opDonker: kleuren.white,
  vlak: zelfde,
  tint: zelfde,
  rand: zelfde,
};

export const DONKER: Kleuren = {
  ink: '#EEF2EC',
  ink2: '#243029',
  lime: kleuren.lime,
  paper: '#0E1411',
  white: '#18201C',
  muted: '#8A968C',
  line: '#2A342E',
  ice: '#1E3133',
  coral: kleuren.coral,
  opLime: kleuren.ink,
  donkerVlak: '#1F2A24',
  opDonker: kleuren.white,
  // Lichte vlakken worden donkere vlakken in dezelfde tint; donkere blijven
  vlak: (hex) => {
    const [h, s, l] = naarHsl(hex);
    return l > 0.5 ? naarHex(h, s * 0.45, 0.11 + (1 - l) * 0.55) : hex;
  },
  // Donkere tekstkleuren worden licht; lichte (al bedoeld voor donkere vlakken) blijven
  tint: (hex) => {
    const [h, s, l] = naarHsl(hex);
    return l < 0.55 ? naarHex(h, Math.min(s, 0.45), 0.62 + (0.55 - l) * 0.45) : hex;
  },
  rand: (hex) => {
    const [h, s, l] = naarHsl(hex);
    return l > 0.5 ? naarHex(h, s * 0.4, 0.17 + (1 - l) * 0.6) : hex;
  },
};
