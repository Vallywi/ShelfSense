import React from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider, ThemeContext } from './src/config/ThemeContext';
import { AuthProvider } from './src/config/AuthContext';
import { TutorialProvider } from './src/config/TutorialContext';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ThemeContext.Consumer>
          {({ isDarkMode }) => (
            <>
              <StatusBar style={isDarkMode ? "light" : "dark"} />
              <TutorialProvider>
                <AppNavigator />
              </TutorialProvider>
            </>
          )}
        </ThemeContext.Consumer>
      </AuthProvider>
    </ThemeProvider>
  );
}
