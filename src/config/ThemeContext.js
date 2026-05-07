import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ThemeContext = createContext();

// ─────────────────────────────────────────────────────────────
// Palette: pastel green + white, with soft sky blue as accent.
// Soft dark mode uses forest-charcoal tones (no pure black).
// ─────────────────────────────────────────────────────────────

export const lightTheme = {
  isDark: false,

  // Surfaces
  background: '#F4FBF6',
  backgroundAlt: '#EAF4EE',
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',
  surface: '#F0F8F3',

  // Text
  text: '#1F3B30',
  subText: '#6B8077',
  textInverse: '#FFFFFF',

  // Brand (pastel green)
  primary: '#7FC8A9',
  primaryDeep: '#5BAE8C',
  primarySoft: '#E0F0E7',
  primaryTint: '#D6EBDF',

  // Accent (soft sky blue)
  accent: '#A8C8DD',
  accentDeep: '#7FB0CC',
  accentSoft: '#E4EFF6',

  // Borders & dividers
  border: '#DBE8DF',
  borderStrong: '#C5D8CC',
  divider: '#EAF1ED',

  // Semantic (softened, still readable)
  danger: '#E07A6E',
  dangerSoft: '#FBE6E3',
  warning: '#E8B870',
  warningSoft: '#FBEFD9',
  safe: '#5BAE8C',
  safeSoft: '#DCEFE3',
  info: '#7FB0CC',
  infoSoft: '#E4EFF6',

  // Shadows
  shadow: '#000000',
  shadowOpacity: 0.18,
  cardShadow: '0px 2px 6px rgba(0, 0, 0, 0.10)',

  // Navigation
  navBackground: '#FFFFFF',
  navText: '#1F3B30',
  navActive: '#5BAE8C',
  navInactive: '#9DB3A8',

  // Overlays
  overlay: 'rgba(20, 40, 30, 0.45)',
  modalOverlay: 'rgba(20, 40, 30, 0.55)',
};

export const darkTheme = {
  isDark: true,

  // Surfaces (soft forest charcoal — not pure black)
  background: '#1A2620',
  backgroundAlt: '#152019',
  card: '#243530',
  cardElevated: '#2D3F39',
  surface: '#1F2D27',

  // Text
  text: '#EAF3EE',
  subText: '#9DB3A8',
  textInverse: '#1F3B30',

  // Brand (lighter pastel green for contrast on dark)
  primary: '#9DD9BA',
  primaryDeep: '#7FC8A9',
  primarySoft: '#2A3D35',
  primaryTint: '#324A40',

  // Accent (soft sky blue, slightly muted)
  accent: '#A8C8DD',
  accentDeep: '#86B0CC',
  accentSoft: '#2C3D47',

  // Borders & dividers
  border: '#34453F',
  borderStrong: '#41544D',
  divider: '#2C3D37',

  // Semantic
  danger: '#E89289',
  dangerSoft: '#3F2A28',
  warning: '#EFC988',
  warningSoft: '#3D3322',
  safe: '#9DD9BA',
  safeSoft: '#2A3D35',
  info: '#A8C8DD',
  infoSoft: '#2C3D47',

  // Shadows
  shadow: '#000000',
  shadowOpacity: 0.32,
  cardShadow: '0px 2px 6px rgba(0, 0, 0, 0.35)',

  // Navigation
  navBackground: '#1F2D27',
  navText: '#EAF3EE',
  navActive: '#9DD9BA',
  navInactive: '#7A8E85',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.55)',
  modalOverlay: 'rgba(0, 0, 0, 0.65)',
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('appTheme');
        if (storedTheme !== null) {
          setIsDarkMode(storedTheme === 'dark');
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    try {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      await AsyncStorage.setItem('appTheme', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  if (!isLoaded) return null;

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
