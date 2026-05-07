import React, { useState, useEffect } from 'react';
import { Platform, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../config/ThemeContext';
import { useAuth } from '../config/AuthContext';

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
import ChefAssistantScreen from '../screens/ChefAssistantScreen';
import AnimatedTabBar from '../components/AnimatedTabBar';
import TourOverlay from '../components/TourOverlay';
import { useTutorial } from '../config/TutorialContext';
import { useTour } from '../config/TourContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const getCustomDarkTheme = (theme) => ({
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: theme.primaryDeep,
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
    primary: theme.primaryDeep,
    background: theme.background,
    card: theme.card,
    text: theme.text,
    border: theme.border,
  },
});

// ── Floating circular Chef tab button ───────────────────────────
function ChefTabButton({ children, onPress, accessibilityState }) {
  const { theme } = useTheme();
  const focused = accessibilityState?.selected;
  return (
    <View style={chefStyles.outerWrap} pointerEvents="box-none">
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={[
          chefStyles.button,
          {
            backgroundColor: focused ? theme.primary : theme.primaryDeep,
            shadowColor: theme.primaryDeep,
            borderColor: theme.background,
          },
        ]}
      >
        {children}
      </TouchableOpacity>
    </View>
  );
}

function MainTabs() {
  const { theme } = useTheme();
  const tour = useTour();
  const navRef = React.useRef(null);

  // When the tour requests a tab switch, navigate to it
  React.useEffect(() => {
    if (tour?.tabSwitchRequest && navRef.current) {
      navRef.current.navigate(tour.tabSwitchRequest);
      tour.consumeTabSwitch();
    }
  }, [tour?.tabSwitchRequest, tour]);

  return (
    <Tab.Navigator
      tabBar={(props) => {
        // Capture navigation ref via tabBar
        if (props.navigation && !navRef.current) {
          navRef.current = props.navigation;
        }
        return <AnimatedTabBar {...props} />;
      }}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Recipes') iconName = focused ? 'restaurant' : 'restaurant-outline';
          else if (route.name === 'Pantries') iconName = focused ? 'file-tray-stacked' : 'file-tray-stacked-outline';
          else if (route.name === 'Settings') iconName = focused ? 'settings' : 'settings-outline';
          else if (route.name === 'Chef') iconName = 'sparkles';
          const iconSize = route.name === 'Chef' ? 26 : (focused ? 24 : 22);
          const iconColor = route.name === 'Chef' ? '#FFFFFF' : color;
          return <Ionicons name={iconName} size={iconSize} color={iconColor} />;
        },
        tabBarActiveTintColor: theme.navActive,
        tabBarInactiveTintColor: theme.navInactive,
        headerStyle: {
          backgroundColor: theme.navBackground,
          borderBottomColor: theme.divider,
          borderBottomWidth: 1,
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTintColor: theme.navText,
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '800',
          letterSpacing: 0.3,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Smart Pantry', headerShown: false }} />
      <Tab.Screen name="Recipes" component={RecipesScreen} />
      <Tab.Screen
        name="Chef"
        component={ChefAssistantScreen}
        options={{
          title: 'Chef Sage',
          headerShown: false,
          tabBarLabel: () => null,
          tabBarButton: (props) => <ChefTabButton {...props} />,
        }}
      />
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

  const stackHeaderStyle = {
    backgroundColor: theme.navBackground,
    borderBottomColor: theme.divider,
    borderBottomWidth: 1,
    shadowColor: 'transparent',
    elevation: 0,
  };
  const stackHeaderTitleStyle = {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  };

  return (
    <NavigationContainer theme={isDarkMode ? getCustomDarkTheme(theme) : getCustomLightTheme(theme)}>
      <View style={{ flex: 1 }}>
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
            <Stack.Screen
              name="AddGroceries"
              component={AddGroceriesScreen}
              options={{
                headerShown: true,
                title: 'Add Groceries',
                headerStyle: stackHeaderStyle,
                headerTintColor: theme.navText,
                headerTitleStyle: stackHeaderTitleStyle,
              }}
            />
            <Stack.Screen
              name="CameraScanner"
              component={CameraScreen}
              options={{
                headerShown: true,
                title: 'Scan Barcode',
                headerStyle: stackHeaderStyle,
                headerTintColor: theme.navText,
                headerTitleStyle: stackHeaderTitleStyle,
              }}
            />
            <Stack.Screen
              name="ExpiryScan"
              component={ExpiryScanScreen}
              options={{
                headerShown: true,
                title: 'Scan Expiry Date',
                headerStyle: stackHeaderStyle,
                headerTintColor: theme.navText,
                headerTitleStyle: stackHeaderTitleStyle,
              }}
            />
            <Stack.Screen
              name="ManualAdd"
              component={ManualAddScreen}
              options={{
                headerShown: true,
                title: 'Add / Edit Item',
                headerStyle: stackHeaderStyle,
                headerTintColor: theme.navText,
                headerTitleStyle: stackHeaderTitleStyle,
              }}
            />
            <Stack.Screen name="Tutorial" component={TutorialScreen} />
          </>
        )}
      </Stack.Navigator>
      <TourOverlay />
      </View>
    </NavigationContainer>
  );
}

const chefStyles = StyleSheet.create({
  outerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -22, // pop above tab bar
    borderWidth: 4,
    elevation: 10,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
});
