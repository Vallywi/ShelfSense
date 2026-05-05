import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../config/ThemeContext';
import { useTutorial } from '../config/TutorialContext';

const { width } = Dimensions.get('window');

const SLIDES = [
  { 
    title: "Track Your Pantry",
    text: "Keep all your groceries organized in one place",
    icon: "file-tray-full-outline",
    accent: "#2ECC71",
    bg: "rgba(46,204,113,0.12)",
  },
  { 
    title: "Avoid Food Waste",
    text: "Get notified before your food expires",
    icon: "notifications-outline",
    accent: "#F39C12",
    bg: "rgba(243,156,18,0.12)",
  },
  { 
    title: "Shop Smarter",
    text: "Make better decisions with smart insights",
    icon: "stats-chart-outline",
    accent: "#3498DB",
    bg: "rgba(52,152,219,0.12)",
  }
];

export default function TutorialScreen({ navigation, route }) {
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const tutorialContext = useTutorial();
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
      // Last slide — go to Survey
      if (fromSettings) {
        navigation.goBack();
      } else {
        navigation.navigate('Survey');
      }
    }
  };

  const slide = SLIDES[currentIndex];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.logo, { color: theme.primary }]}>ShelfSense</Text>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={[styles.skipText, { color: theme.subText }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.slideContainer, { opacity: fadeAnim }]}>
        <View style={[styles.iconCircle, { backgroundColor: slide.bg, borderColor: slide.accent + '44' }]}>
          <View style={[styles.iconInner, { backgroundColor: slide.accent + '22' }]}>
            <Ionicons name={slide.icon} size={72} color={slide.accent} />
          </View>
        </View>

        <View style={[styles.slideNumber, { backgroundColor: slide.accent + '22' }]}>
          <Text style={[styles.slideNumberText, { color: slide.accent }]}>{currentIndex + 1} of {SLIDES.length}</Text>
        </View>

        <Text style={[styles.title, { color: theme.text }]}>{slide.title}</Text>
        <Text style={[styles.text, { color: theme.subText }]}>{slide.text}</Text>
      </Animated.View>
      
      <View style={styles.footer}>
        <View style={styles.dotsContainer}>
          {SLIDES.map((s, index) => (
            <TouchableOpacity key={index} onPress={() => animateTransition(() => setCurrentIndex(index))}>
              <View 
                style={[
                  styles.dot, 
                  { backgroundColor: theme.border }, 
                  currentIndex === index && { backgroundColor: slide.accent, width: 28 }
                ]} 
              />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: slide.accent }]} 
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>
            {currentIndex === SLIDES.length - 1 ? "Get Started 🚀" : "Next →"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  logo: { fontSize: 20, fontWeight: '800', letterSpacing: 0.5 },
  skipText: { fontSize: 16, fontWeight: '500' },
  slideContainer: { 
    flex: 1,
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 30,
  },
  iconCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconInner: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideNumber: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 20,
  },
  slideNumberText: { fontSize: 13, fontWeight: '600' },
  title: { 
    fontSize: 30, 
    fontWeight: '800', 
    marginBottom: 14, 
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  text: { 
    fontSize: 17, 
    textAlign: 'center', 
    lineHeight: 26,
    paddingHorizontal: 10,
  },
  footer: { 
    paddingHorizontal: 30,
    paddingBottom: 50,
  },
  dotsContainer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginBottom: 24,
    gap: 8,
  },
  dot: { 
    width: 10, 
    height: 10, 
    borderRadius: 5,
  },
  button: { 
    padding: 18, 
    borderRadius: 16, 
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
