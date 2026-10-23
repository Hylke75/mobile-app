import Svg, { Circle, Path, Rect } from 'react-native-svg';

// Exacte paden uit ICONS in docs/ontwerp/prototype/app.js
const ICONS = {
  home: <Path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" />,
  clock: (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 7v5l3 2" />
    </>
  ),
  chart: <Path d="M4 20V10M10 20V4M16 20v-7M22 20v-12" />,
  user: (
    <>
      <Circle cx="12" cy="8" r="4" />
      <Path d="M5 21c0-4 3-6 7-6s7 2 7 6" />
    </>
  ),
  arrow: <Path d="M5 12h14m-6-6 6 6-6 6" />,
  chevron: <Path d="m15 18-6-6 6-6" />,
  plus: <Path d="M12 5v14M5 12h14" />,
  check: <Path d="m4 12 5 5L20 6" />,
  flame: (
    <Path d="M12 22c5 0 8-3.4 8-8.1 0-2.9-1.4-5.4-3.2-7.2.1 2.7-1.1 4.1-2.2 4.5C15.1 6.2 12.5 3.4 10 2c.2 3.8-2 5.8-4 8.4C4.6 12.2 4 13.6 4 15c0 4 3.4 7 8 7z" />
  ),
  play: <Path d="m8 5 11 7-11 7z" />,
  sound: <Path d="M11 5 6 9H3v6h3l5 4zM15 9a5 5 0 0 1 0 6M18 6a9 9 0 0 1 0 12" />,
  close: <Path d="M5 5 19 19M19 5 5 19" />,
  shield: (
    <>
      <Path d="m12 2 8 4v5c0 5-3 9-8 11-5-2-8-6-8-11V6z" />
      <Path d="m8 12 3 3 5-6" />
    </>
  ),
  calendar: (
    <>
      <Rect x="3" y="5" width="18" height="16" rx="2" />
      <Path d="M7 3v4m10-4v4M3 10h18" />
    </>
  ),
  activity: <Path d="M2 12h4l3-7 5 14 3-7h5" />,
  target: (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Circle cx="12" cy="12" r="5" />
      <Circle cx="12" cy="12" r="1" />
    </>
  ),
  heart: <Path d="M20 5c-2-2-5-2-7 0l-1 1-1-1C9 3 6 3 4 5s-2 5 0 7l8 8 8-8c2-2 2-5 0-7z" />,
  info: (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 11v5m0-9h.01" />
    </>
  ),
  bell: <Path d="M5 17h14c-1.5-2-2-3-2-7a5 5 0 0 0-10 0c0 4-.5 5-2 7zm4 3h6" />,
  lock: (
    <>
      <Rect x="5" y="10" width="14" height="11" rx="2" />
      <Path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
};

export type IconNaam = keyof typeof ICONS;

type Props = {
  name: IconNaam;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 1.8 }: Props) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ICONS[name]}
    </Svg>
  );
}
