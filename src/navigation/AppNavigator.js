import React, { useState, useEffect } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../config/ThemeContext';
import { useAuth } from '../config/AuthContext';
// Screens
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import RecipesScreen from '../screens/RecipesScreen';
import PantryScreen from '../screens/PantryScreen';
import PantryDetailScreen from '../screens/PantryDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AddGroceriesScreen from '../screens/AddGroceriesScreen';
import CameraScreen from '../screens/CameraScreen';
import ExpiryScanScreen from '../screens/ExpiryScanScreen';
import ManualAddScreen from '../screens/ManualAddScreen';
import TutorialScreen from '../screens/TutorialScreen';
import SurveyScreen from '../screens/SurveyScreen';
import RecipeDetailScreen from '../screens/RecipeDetailScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import { useTutorial } from '../config/TutorialContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const getCustomDarkTheme = (theme) => ({
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: theme.primary,
    background: theme.background,
    card: theme.card,
    text: theme.text,
    border: theme.border,
  },
});

const getCustomLightTheme = (theme) => ({
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: theme.primary,
    background: theme.background,
    card: theme.card,
    text: theme.text,
    border: theme.border,
  },
});

function MainTabs() {
  const { theme } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Recipes') iconName = focused ? 'restaurant' : 'restaurant-outline';
          else if (route.name === 'Pantries') iconName = focused ? 'file-tray-stacked' : 'file-tray-stacked-outline';
          else if (route.name === 'Settings') iconName = focused ? 'settings' : 'settings-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.navActive,
        tabBarInactiveTintColor: theme.navInactive,
        headerStyle: { backgroundColor: theme.navBackground },
        headerTintColor: theme.navText,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Smart Pantry' }} />
      <Tab.Screen name="Recipes" component={RecipesScreen} />
      <Tab.Screen name="Pantries" component={PantryScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { theme, isDarkMode } = useTheme();
  const { currentUser } = useAuth();
  const { hasSeenTutorial } = useTutorial() || { hasSeenTutorial: true };
  const [isFirstTime, setIsFirstTime] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('hasOnboarded').then(val => {
      setIsFirstTime(val !== 'true');
    });
  }, []);

  if (isFirstTime === null || (currentUser && hasSeenTutorial === null)) {
    return null; 
  }

  return (
    <NavigationContainer theme={isDarkMode ? getCustomDarkTheme(theme) : getCustomLightTheme(theme)}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!currentUser ? (
          <>
            {isFirstTime && <Stack.Screen name="Onboarding" component={OnboardingScreen} />}
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : !hasSeenTutorial ? (
          <>
            <Stack.Screen name="Tutorial" component={TutorialScreen} />
            <Stack.Screen name="Survey" component={SurveyScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="PantryDetail" component={PantryDetailScreen} options={{ headerShown: false }} />
            <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AddGroceries" component={AddGroceriesScreen} options={{ headerShown: true, title: 'Add Groceries', headerStyle: { backgroundColor: theme.navBackground }, headerTintColor: theme.navText }} />
            <Stack.Screen name="CameraScanner" component={CameraScreen} options={{ headerShown: true, title: 'Scan Barcode', headerStyle: { backgroundColor: theme.navBackground }, headerTintColor: theme.navText }} />
            <Stack.Screen name="ExpiryScan" component={ExpiryScanScreen} options={{ headerShown: true, title: 'Scan Expiry Date', headerStyle: { backgroundColor: theme.navBackground }, headerTintColor: theme.navText }} />
            <Stack.Screen name="ManualAdd" component={ManualAddScreen} options={{ headerShown: true, title: 'Add/Edit Item', headerStyle: { backgroundColor: theme.navBackground }, headerTintColor: theme.navText }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
