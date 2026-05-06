import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Platform, Text } from 'react-native';
import { useTheme } from '../config/ThemeContext';
import TourTarget from './TourTarget';

const TAB_TOUR_IDS = {
  Home: 'tab-home',
  Recipes: 'tab-recipes',
  Chef: 'tab-chef',
  Pantries: 'tab-pantries',
  Settings: 'tab-settings',
};

/**
 * Custom bottom tab bar with a sliding pill indicator behind the active tab.
 * The "Chef" tab still uses its original ChefTabButton via its `tabBarButton` option.
 */
export default function AnimatedTabBar({ state, descriptors, navigation }) {
  const { theme } = useTheme();
  const slide = useRef(new Animated.Value(0)).current;
  const containerWidthRef = useRef(0);

  useEffect(() => {
    Animated.spring(slide, {
      toValue: state.index,
      useNativeDriver: false,
      tension: 80,
      friction: 12,
    }).start();
  }, [state.index, slide]);

  const tabCount = state.routes.length;

  const onContainerLayout = (e) => {
    containerWidthRef.current = e.nativeEvent.layout.width;
  };

  // Pill should NOT appear behind the floating Chef tab
  const pillTranslate = slide.interpolate({
    inputRange: state.routes.map((_, i) => i),
    outputRange: state.routes.map((_, i) => (containerWidthRef.current / tabCount) * i),
  });

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.navBackground,
          borderTopColor: theme.divider,
          shadowOpacity: theme.isDark ? 0.3 : 0.06,
          paddingBottom: Platform.OS === 'ios' ? 22 : 6,
        },
      ]}
      onLayout={onContainerLayout}
    >
      {/* Sliding pill indicator (sits behind tab content) */}
      {containerWidthRef.current > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.pill,
            {
              backgroundColor: theme.primarySoft,
              width: (containerWidthRef.current / tabCount) - 16,
              left: 8,
              transform: [{ translateX: pillTranslate }],
              opacity: state.routes[state.index]?.name === 'Chef' ? 0 : 1,
            },
          ]}
        />
      )}

      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const tourId = TAB_TOUR_IDS[route.name];

        // Use custom button if defined (Chef tab)
        if (options.tabBarButton) {
          return (
            <TourTarget key={route.key} id={tourId} style={styles.tabSlot}>
              <View pointerEvents="box-none" style={{ flex: 1 }}>
                {options.tabBarButton({
                  onPress,
                  accessibilityState: { selected: isFocused },
                  children: options.tabBarIcon
                    ? options.tabBarIcon({ focused: isFocused, color: theme.navActive, size: 24 })
                    : null,
                })}
              </View>
            </TourTarget>
          );
        }

        const color = isFocused ? theme.navActive : theme.navInactive;
        const iconNode = options.tabBarIcon
          ? options.tabBarIcon({ focused: isFocused, color, size: 22 })
          : null;
        const label = options.title || options.tabBarLabel || route.name;

        return (
          <TourTarget key={route.key} id={tourId} style={styles.tabSlot}>
            <TouchableOpacity
              onPress={onPress}
              activeOpacity={0.7}
              style={styles.tabSlotInner}
            >
              {iconNode}
              <Text style={[styles.label, { color, fontWeight: isFocused ? '800' : '600' }]} numberOfLines={1}>
                {label}
              </Text>
            </TouchableOpacity>
          </TourTarget>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 84 : 66,
    paddingTop: 8,
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 8,
  },
  pill: {
    position: 'absolute',
    top: 6,
    bottom: Platform.OS === 'ios' ? 22 : 6,
    borderRadius: 14,
    marginHorizontal: 0,
  },
  tabSlot: {
    flex: 1,
  },
  tabSlotInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
});
