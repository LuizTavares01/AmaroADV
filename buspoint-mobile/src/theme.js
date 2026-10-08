/* Tokens visuais do BusPoint (convertidos de oklch do styles.css para hex). */
export const colors = {
  background: '#f3f7fc',
  foreground: '#0b1c2c',
  card: '#ffffff',
  primary: '#1162c4',
  primaryForeground: '#ffffff',
  primaryHover: '#2b72ca',
  secondary: '#e0ecfc',
  muted: '#eff4f9',
  mutedForeground: '#667381',
  accent: '#e0ecfc',
  border: '#dbe2ea',
  line: '#e6ecf2',
  destructive: '#db2b33',
  success: '#007f41',
  warning: '#cd8d00',
  navy: '#021528',
  surfaceBlue: '#e8f3ff',
  softGreen: '#dbf7e3',
  softYellow: '#ffefd1',
  softRed: '#ffe9e6',
  navText: '#99a6b4',
  navActiveText: '#a5ddff',
  navActiveBg: 'rgba(17, 98, 196, 0.25)',
  white65: 'rgba(255,255,255,0.65)',
  white70: 'rgba(255,255,255,0.70)',
  white60: 'rgba(255,255,255,0.60)',
  white40: 'rgba(255,255,255,0.40)',
  white15: 'rgba(255,255,255,0.15)',
  white10: 'rgba(255,255,255,0.10)',
  white5: 'rgba(255,255,255,0.05)',
  backdrop: 'rgba(2, 21, 40, 0.6)',
  overlay: 'rgba(2, 21, 40, 0.5)',
};

export const radius = { sm: 4, md: 6, lg: 8, full: 999 };

// DM Sans (texto) e Sora (títulos), carregadas via @expo-google-fonts
const SANS = { 400: 'DMSans_400Regular', 500: 'DMSans_500Medium', 600: 'DMSans_600SemiBold', 700: 'DMSans_700Bold', 800: 'DMSans_800ExtraBold' };
const DISPLAY = { 400: 'Sora_400Regular', 500: 'Sora_500Medium', 600: 'Sora_600SemiBold', 700: 'Sora_700Bold', 800: 'Sora_800ExtraBold' };

export const font = (weight = 400, display = false) => ({ fontFamily: (display ? DISPLAY : SANS)[weight] || SANS[400] });

export const shadow = {
  sm: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  lg: { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 25, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
};

export const breakpoints = { sm: 640, md: 768, lg: 1024, xl: 1280 };
