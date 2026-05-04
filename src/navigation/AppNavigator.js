import React, { useState, useEffect } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Screens
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import RecipesScreen from '../screens/RecipesScreen';
import PantryScreen from '../screens/PantryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AddGroceriesScreen from '../screens/AddGroceriesScreen';
import CameraScreen from '../screens/CameraScreen';
import ManualAddScreen from '../screens/ManualAddScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#2ECC71',
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    border: '#333333',
  },
};

function MainTabs() {
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
        tabBarActiveTintColor: '#2ECC71',
        tabBarInactiveTintColor: 'gray',
        headerStyle: { backgroundColor: '#1E1E1E' },
        headerTintColor: '#fff',
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
  const [isFirstLaunch, setIsFirstLaunch] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('alreadyLaunched').then(value => {
      if (value === null) {
        AsyncStorage.setItem('alreadyLaunched', 'true');
        setIsFirstLaunch(true);
      } else {
        setIsFirstLaunch(false);
      }
    });
  }, []);

  if (isFirstLaunch === null) {
    return null; // or a loading splash
  }

  return (
    <NavigationContainer theme={CustomDarkTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false, presentation: 'modal' }}>
        {isFirstLaunch && (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        )}
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="AddGroceries" component={AddGroceriesScreen} options={{ headerShown: true, title: 'Add Groceries' }} />
        <Stack.Screen name="CameraScanner" component={CameraScreen} options={{ headerShown: true, title: 'Scan Barcode' }} />
        <Stack.Screen name="ManualAdd" component={ManualAddScreen} options={{ headerShown: true, title: 'Add Item Manually' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
