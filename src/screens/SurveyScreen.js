import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  ScrollView, Platform, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../config/ThemeContext';
import { useTutorial } from '../config/TutorialContext';
import { updateUserProfile } from '../services/api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const ITEM_HEIGHT = 52;
const VISIBLE_ITEMS = 5;
const AGES = Array.from({ length: 71 }, (_, i) => i + 10); // 10–80
const DEFAULT_AGE_INDEX = 10; // age 20

const GENDERS = [
  { label: 'Male', icon: 'man-outline' },
  { label: 'Female', icon: 'woman-outline' },
  { label: 'Prefer not to say', icon: 'person-outline' },
];

export default function SurveyScreen({ navigation }) {
  const { theme } = useTheme();
  const tutorialContext = useTutorial();

  const [selectedAge, setSelectedAge] = useState(AGES[DEFAULT_AGE_INDEX]);
  const [selectedGender, setSelectedGender] = useState('');
  const [saving, setSaving] = useState(false);

  const scrollRef = useRef(null);

  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, AGES.length - 1));
    setSelectedAge(AGES[clampedIndex]);
  };

  const handleContinue = async () => {
    if (!selectedGender) return;
    setSaving(true);
    
    // 1. Instantly complete tutorial locally so user can proceed
    if (tutorialContext && tutorialContext.completeTutorial) {
      tutorialContext.completeTutorial();
    }

    try {
      // 2. Save to backend in background
      await updateUserProfile({
        age: selectedAge,
        gender: selectedGender,
        onboardingCompleted: true,
      });
    } catch (e) {
      console.error('Background profile save error:', e);
    }
  };

  const handleSkip = async () => {
    setSaving(true);
    
    // 1. Instantly complete tutorial locally
    if (tutorialContext && tutorialContext.completeTutorial) {
      tutorialContext.completeTutorial();
    }

    try {
      // 2. Mark as completed in background
      await updateUserProfile({ onboardingCompleted: true });
    } catch (e) {
      console.error('Background skip error:', e);
    }
  };

  const isOlderUser = selectedAge >= 50;
  const baseFontSize = isOlderUser ? 17 : 15;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: theme.primary + '22' }]}>
          <Ionicons name="person-add-outline" size={18} color={theme.primary} />
          <Text style={[styles.badgeText, { color: theme.primary }]}>Quick Setup</Text>
        </View>
        <Text style={[styles.title, { color: theme.text }]}>Tell us about you</Text>
        <Text style={[styles.subtitle, { color: theme.subText, fontSize: baseFontSize }]}>
          We'll personalize your pantry experience
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Age Picker */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Age</Text>
          </View>

          <View style={styles.pickerWrapper}>
            <View style={[styles.pickerHighlight, { borderColor: theme.primary, backgroundColor: theme.primary + '15' }]} pointerEvents="none" />
            <ScrollView
              ref={scrollRef}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              onMomentumScrollEnd={handleScroll}
              contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
              style={styles.picker}
            >
              {AGES.map((age) => {
                const isSelected = age === selectedAge;
                return (
                  <View key={age} style={styles.pickerItem}>
                    <Text style={[
                      styles.pickerText,
                      { color: isSelected ? theme.primary : theme.subText },
                      isSelected && styles.pickerTextSelected,
                    ]}>
                      {age}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
            <View style={[styles.pickerFadeTop, { backgroundColor: theme.card }]} pointerEvents="none" />
            <View style={[styles.pickerFadeBottom, { backgroundColor: theme.card }]} pointerEvents="none" />
          </View>

          <Text style={[styles.selectedAgeLabel, { color: theme.primary }]}>Selected: {selectedAge} years old</Text>
        </View>

        {/* Gender Selection */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people-outline" size={20} color={theme.primary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Gender</Text>
          </View>

          <View style={styles.genderGrid}>
            {GENDERS.map((g) => {
              const isActive = selectedGender === g.label;
              return (
                <TouchableOpacity
                  key={g.label}
                  style={[
                    styles.genderCard,
                    { backgroundColor: theme.background, borderColor: theme.border },
                    isActive && { backgroundColor: theme.primary + '18', borderColor: theme.primary }
                  ]}
                  onPress={() => setSelectedGender(g.label)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={g.icon} size={28} color={isActive ? theme.primary : theme.subText} />
                  <Text style={[
                    styles.genderLabel,
                    { color: isActive ? theme.primary : theme.text, fontSize: baseFontSize - 1 },
                    isActive && { fontWeight: '700' }
                  ]}>
                    {g.label}
                  </Text>
                  {isActive && (
                    <View style={[styles.checkBadge, { backgroundColor: theme.primary }]}>
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Personalization hint */}
        {isOlderUser && (
          <View style={[styles.hintCard, { backgroundColor: '#3498DB18', borderColor: '#3498DB44' }]}>
            <Ionicons name="text-outline" size={18} color="#3498DB" />
            <Text style={[styles.hintText, { color: '#3498DB' }]}>
              We'll show larger text and clearer reminders for you 👍
            </Text>
          </View>
        )}

        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.continueBtn,
            { backgroundColor: theme.primary, zIndex: 10, elevation: 10 },
            !selectedGender && { opacity: 0.45 }
          ]}
          onPress={handleContinue}
          disabled={!selectedGender || saving}
          activeOpacity={0.85}
        >
          <Text style={styles.continueBtnText}>
            {saving ? 'Setting up…' : 'Continue →'}
          </Text>
        </TouchableOpacity>

        {/* Skip Button */}
        <TouchableOpacity
          style={[styles.skipBtn, { zIndex: 10, elevation: 10 }]}
          onPress={handleSkip}
          disabled={saving}
          activeOpacity={0.7}
        >
          <Text style={[styles.skipBtnText, { color: theme.subText }]}>
            Skip for now
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 8, alignItems: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, gap: 6, marginBottom: 12 },
  badgeText: { fontSize: 13, fontWeight: '700' },
  title: { fontSize: 30, fontWeight: '800', textAlign: 'center', marginBottom: 8, letterSpacing: 0.3 },
  subtitle: { textAlign: 'center', marginBottom: 8, lineHeight: 22 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },
  section: { borderRadius: 18, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  pickerWrapper: { height: ITEM_HEIGHT * VISIBLE_ITEMS, overflow: 'hidden', position: 'relative' },
  picker: { flex: 1 },
  pickerItem: { height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' },
  pickerText: { fontSize: 22, fontWeight: '400' },
  pickerTextSelected: { fontSize: 28, fontWeight: '800' },
  pickerHighlight: { position: 'absolute', top: ITEM_HEIGHT * 2, left: 20, right: 20, height: ITEM_HEIGHT, borderRadius: 12, borderWidth: 2, zIndex: 1 },
  pickerFadeTop: { position: 'absolute', top: 0, left: 0, right: 0, height: ITEM_HEIGHT * 2, opacity: 0.8, zIndex: 2 },
  pickerFadeBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: ITEM_HEIGHT * 2, opacity: 0.8, zIndex: 2 },
  selectedAgeLabel: { textAlign: 'center', marginTop: 12, fontWeight: '700', fontSize: 15 },
  genderGrid: { flexDirection: 'row', gap: 10 },
  genderCard: { flex: 1, borderRadius: 14, borderWidth: 2, padding: 14, alignItems: 'center', gap: 8, position: 'relative', minHeight: 90, justifyContent: 'center' },
  genderLabel: { textAlign: 'center', fontWeight: '500' },
  checkBadge: { position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  hintCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  hintText: { flex: 1, fontSize: 14, lineHeight: 20 },
  continueBtn: {
    padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 8,
    shadowColor: '#2ECC71', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  continueBtnText: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 0.3 },
  skipBtn: { padding: 16, alignItems: 'center', marginTop: 8 },
  skipBtnText: { fontSize: 15, fontWeight: '600', textDecorationLine: 'underline' },
});
