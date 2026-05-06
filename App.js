import React from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider, ThemeContext } from './src/config/ThemeContext';
import { AuthProvider } from './src/config/AuthContext';
import { TutorialProvider } from './src/config/TutorialContext';
import { ToastProvider } from './src/config/ToastContext';
import { TourProvider } from './src/config/TourContext';

export default function App() {
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
