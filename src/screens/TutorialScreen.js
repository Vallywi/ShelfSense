import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../config/ThemeContext';

const SLIDES = [
  {
    title: 'Track Your Pantry',
    text: 'Keep all your groceries organized in one beautiful place',
    icon: 'file-tray-full-outline',
    accentKey: 'primary',
  },
  {
    title: 'Avoid Food Waste',
    text: 'Get gentle reminders before your food expires',
    icon: 'notifications-outline',
    accentKey: 'warning',
  },
  {
    title: 'Shop Smarter',
    text: 'Make better decisions with smart pantry insights',
    icon: 'stats-chart-outline',
    accentKey: 'accent',
  },
];

const getAccent = (theme, key) => {
  if (key === 'primary') return { color: theme.primaryDeep, bg: theme.primarySoft };
  if (key === 'warning') return { color: theme.warning, bg: theme.warningSoft };
  if (key === 'accent') return { color: theme.accentDeep, bg: theme.accentSoft };
  return { color: theme.primaryDeep, bg: theme.primarySoft };
};

export default function TutorialScreen({ navigation, route }) {
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const fromSettings = route?.params?.fromSettings;

  const animateTransition = (cb) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    setTimeout(cb, 150);
  };

  const handleSkip = () => {
    if (fromSettings) {
      navigation.goBack();
    } else {
      navigation.navigate('Survey');
    }
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      animateTransition(() => setCurrentIndex(i => i + 1));
    } else {
      if (fromSettings) {
        navigation.goBack();
      } else {
        navigation.navigate('Survey');
      }
    }
  };

  const slide = SLIDES[currentIndex];
  const accent = getAccent(theme, slide.accentKey);
  const isLastSlide = currentIndex === SLIDES.length - 1;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.logo, { color: theme.primaryDeep }]}>ShelfSense</Text>
        <TouchableOpacity onPress={handleSkip} activeOpacity={0.7}>
          <Text style={[styles.skipText, { color: theme.subText }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.slideContainer, { opacity: fadeAnim }]}>
        <View style={[styles.iconCircle, { backgroundColor: accent.bg, borderColor: accent.color + '33' }]}>
          <View style={[styles.iconInner, { backgroundColor: theme.card }]}>
            <Ionicons name={slide.icon} size={64} color={accent.color} />
          </View>
        </View>

        <View style={[styles.slideNumber, { backgroundColor: accent.bg }]}>
          <Text style={[styles.slideNumberText, { color: accent.color }]}>
            {currentIndex + 1} of {SLIDES.length}
          </Text>
        </View>

        <Text style={[styles.title, { color: theme.text }]}>{slide.title}</Text>
        <Text style={[styles.text, { color: theme.subText }]}>{slide.text}</Text>
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.dotsContainer}>
          {SLIDES.map((s, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => animateTransition(() => setCurrentIndex(index))}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.dot,
                  { backgroundColor: theme.border },
                  currentIndex === index && { backgroundColor: accent.color, width: 28 },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: accent.color, shadowColor: accent.color }]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>
            {isLastSlide ? 'Get Started' : 'Next'}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8,
  },
  logo: { fontSize: 20, fontWeight: '800', letterSpacing: 0.5 },
  skipText: { fontSize: 14, fontWeight: '600' },

  slideContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  iconCircle: {
    width: 190, height: 190, borderRadius: 95,
    borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center', marginBottom: 18,
  },
  iconInner: {
    width: 140, height: 140, borderRadius: 70,
    justifyContent: 'center', alignItems: 'center',
  },
  slideNumber: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, marginBottom: 20 },
  slideNumberText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

  title: { fontSize: 28, fontWeight: '800', marginBottom: 14, textAlign: 'center', letterSpacing: 0.3 },
  text: { fontSize: 16, textAlign: 'center', lineHeight: 24, paddingHorizontal: 10, fontWeight: '500' },

  footer: { paddingHorizontal: 30, paddingBottom: 50 },
  dotsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 24, gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },

  button: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    paddingVertical: 17, borderRadius: 16,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
});
