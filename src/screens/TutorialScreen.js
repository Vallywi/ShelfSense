import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../config/ThemeContext';
import { useTour } from '../config/TourContext';
import { useTutorial } from '../config/TutorialContext';

/**
 * Optional tour launcher screen — shown after Survey on first login,
 * or accessed via Settings → Replay Tutorial.
 *
 * Lets the user choose: take the interactive tour, or skip and dive in.
 */
export default function TutorialScreen({ navigation, route }) {
  const { theme } = useTheme();
  const tour = useTour();
  const tutorial = useTutorial();

  const fromSettings = route?.params?.fromSettings;

  const handleStartTour = async () => {
    if (!fromSettings && tutorial?.completeTutorial) {
      await tutorial.completeTutorial();
    }
    if (fromSettings && tour?.resetTourCompletion) {
      await tour.resetTourCompletion();
    }
    tour?.startTour();
    if (fromSettings) {
      navigation.goBack();
    }
  };

  const handleSkip = async () => {
    if (!fromSettings && tutorial?.completeTutorial) {
      await tutorial.completeTutorial();
    }
    if (fromSettings) {
      navigation.goBack();
    }
  };

  const features = [
    { icon: 'basket', label: 'Pantry status at a glance', color: theme.primaryDeep },
    { icon: 'add-circle', label: 'Quick add via barcode or AI', color: theme.accentDeep },
    { icon: 'sparkles', label: 'Chef Sage AI assistant', color: theme.primaryDeep },
    { icon: 'people', label: 'Shared pantries with family', color: theme.accentDeep },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.hero}>
          <View style={[styles.heroBackdrop, { backgroundColor: theme.primarySoft }]} />
          <View style={[styles.heroAccent, { backgroundColor: theme.accentSoft }]} />
          <View style={[styles.heroLogo, { backgroundColor: theme.primaryDeep, shadowColor: theme.primaryDeep }]}>
            <Ionicons name="rocket" size={32} color="#FFFFFF" />
          </View>
        </View>

        <Text style={[styles.brandLabel, { color: theme.primaryDeep }]}>QUICK TOUR</Text>
        <Text style={[styles.title, { color: theme.text }]}>
          {fromSettings ? 'Replay the tour' : "You're all set!"}
        </Text>
        <Text style={[styles.subtitle, { color: theme.subText }]}>
          Want a quick walkthrough of the main features? It takes about a minute, and you can skip any time.
        </Text>

        <View style={[styles.featureCard, { backgroundColor: theme.card, borderColor: theme.border, shadowOpacity: theme.shadowOpacity }]}>
          <Text style={[styles.featureLabel, { color: theme.subText }]}>WHAT YOU'LL SEE</Text>
          {features.map((f) => (
            <View key={f.label} style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: f.color + '22' }]}>
                <Ionicons name={f.icon} size={16} color={f.color} />
              </View>
              <Text style={[styles.featureText, { color: theme.text }]}>{f.label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: theme.primaryDeep, shadowColor: theme.primaryDeep }]}
          onPress={handleStartTour}
          activeOpacity={0.85}
        >
          <Ionicons name="play" size={16} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>Take the Tour</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <Text style={[styles.secondaryBtnText, { color: theme.subText }]}>
            {fromSettings ? 'Cancel' : "Skip — I'll explore on my own"}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 30, paddingBottom: 40, alignItems: 'center' },

  hero: { width: 140, height: 140, marginBottom: 16, position: 'relative' },
  heroBackdrop: {
    position: 'absolute', top: 12, left: 12, width: 120, height: 120, borderRadius: 32,
    transform: [{ rotate: '-8deg' }],
  },
  heroAccent: {
    position: 'absolute', top: 0, right: 0, width: 80, height: 80, borderRadius: 26,
    transform: [{ rotate: '10deg' }],
  },
  heroLogo: {
    position: 'absolute', top: 25, left: 30, width: 84, height: 84, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },

  brandLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 2.5, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 10, letterSpacing: 0.3 },
  subtitle: {
    fontSize: 14, textAlign: 'center', lineHeight: 21, fontWeight: '500',
    marginBottom: 26, paddingHorizontal: 10,
  },

  featureCard: {
    width: '100%', padding: 16, borderRadius: 18, borderWidth: 1, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 1,
  },
  featureLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 12 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 7 },
  featureIcon: {
    width: 32, height: 32, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
  },
  featureText: { fontSize: 14, fontWeight: '600', flex: 1 },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    width: '100%', paddingVertical: 16, borderRadius: 14,
    elevation: 5, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  secondaryBtn: { paddingVertical: 14, marginTop: 8 },
  secondaryBtnText: { fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
});
