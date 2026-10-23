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
