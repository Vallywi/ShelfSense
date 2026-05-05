import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ThemeContext = createContext();

export const lightTheme = {
  isDark: false,
  background: '#F5F6FA',
  card: '#FFFFFF',
  text: '#2C3E50',
  subText: '#7F8C8D',
  primary: '#2ECC71',
  border: '#E0E0E0',
  danger: '#E74C3C',
  warning: '#F39C12',
  safe: '#27AE60',
  navBackground: '#FFFFFF',
  navText: '#2C3E50',
  navActive: '#2ECC71',
  navInactive: '#95A5A6',
};

export const darkTheme = {
  isDark: true,
  background: '#121212',
  card: '#1E1E1E',
  text: '#FFFFFF',
  subText: '#888888',
  primary: '#2ECC71',
  border: '#333333',
  danger: '#E74C3C',
  warning: '#F39C12',
  safe: '#27AE60',
  navBackground: '#1E1E1E',
  navText: '#FFFFFF',
  navActive: '#2ECC71',
  navInactive: '#888888',
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
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
