import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../config/ThemeContext';

/**
 * A shimmering placeholder block. Use to fill space during initial fetch.
 */
export function SkeletonBlock({ width, height = 16, radius = 8, style }) {
  const { theme } = useTheme();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: false }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: theme.surface,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function PantryItemSkeleton() {
  const { theme } = useTheme();
  return (
    <View style={[styles.itemSkel, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <SkeletonBlock width={4} height={56} radius={0} />
      <SkeletonBlock width={50} height={50} radius={14} style={{ marginLeft: 12 }} />
      <View style={{ flex: 1, marginLeft: 14, gap: 6 }}>
        <SkeletonBlock width="65%" height={14} />
        <SkeletonBlock width="40%" height={11} />
      </View>
      <SkeletonBlock width={56} height={22} radius={10} style={{ marginRight: 12 }} />
    </View>
  );
}

export function SummaryCardSkeleton() {
  const { theme } = useTheme();
  return (
    <View style={[styles.summarySkel, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <SkeletonBlock width={36} height={36} radius={18} style={{ marginBottom: 8 }} />
      <SkeletonBlock width={28} height={20} />
      <SkeletonBlock width={42} height={10} style={{ marginTop: 4 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  itemSkel: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 14, marginBottom: 10,
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, height: 80,
  },
  summarySkel: {
    flex: 1, padding: 14, borderRadius: 16,
    alignItems: 'center', borderWidth: 1,
  },
});
