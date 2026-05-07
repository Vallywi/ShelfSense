import React from 'react';
import { Text, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider, ThemeContext } from './src/config/ThemeContext';
import { AuthProvider } from './src/config/AuthContext';
import { TutorialProvider } from './src/config/TutorialContext';
import { ToastProvider } from './src/config/ToastContext';
import { TourProvider } from './src/config/TourContext';

const applyGlobalFont = () => {
  const baseStyle = { fontFamily: 'PlusJakartaSans_500Medium' };
  Text.defaultProps = Text.defaultProps || {};
  Text.defaultProps.style = [baseStyle, Text.defaultProps.style];
  TextInput.defaultProps = TextInput.defaultProps || {};
  TextInput.defaultProps.style = [baseStyle, TextInput.defaultProps.style];
};

export default function App() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  if (fontsLoaded) applyGlobalFont();
  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <ThemeContext.Consumer>
            {({ isDarkMode }) => (
              <>
                <StatusBar style={isDarkMode ? "light" : "dark"} />
                <TutorialProvider>
                  <TourProvider>
                    <AppNavigator />
                  </TourProvider>
                </TutorialProvider>
              </>
            )}
          </ThemeContext.Consumer>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
