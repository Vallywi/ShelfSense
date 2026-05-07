import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../config/ThemeContext';
import { useTutorial } from '../config/TutorialContext';
import { updateUserProfile } from '../services/api';

const MIN_AGE = 10;
const MAX_AGE = 80;
const DEFAULT_AGE = 20;
const QUICK_PICKS = [18, 25, 35, 50, 65];

const GENDERS = [
  { label: 'Male', icon: 'man-outline' },
  { label: 'Female', icon: 'woman-outline' },
  { label: 'Prefer not to say', icon: 'person-outline' },
];

export default function SurveyScreen({ navigation }) {
  const { theme } = useTheme();
  const tutorialContext = useTutorial();

  const [selectedAge, setSelectedAge] = useState(DEFAULT_AGE);
  const [selectedGender, setSelectedGender] = useState('');
  const [saving, setSaving] = useState(false);

  const adjustAge = (delta) => {
    setSelectedAge((curr) => Math.max(MIN_AGE, Math.min(MAX_AGE, curr + delta)));
  };

  const handleContinue = async () => {
    if (!selectedGender) return;
    setSaving(true);

    if (tutorialContext && tutorialContext.completeTutorial) {
      tutorialContext.completeTutorial();
    }

    try {
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
    if (tutorialContext && tutorialContext.completeTutorial) {
      tutorialContext.completeTutorial();
    }
    try {
      await updateUserProfile({ onboardingCompleted: true });
    } catch (e) {
      console.error('Background skip error:', e);
    }
  };

  const isOlderUser = selectedAge >= 50;
  const baseFontSize = isOlderUser ? 16 : 14;
  const minusDisabled = selectedAge <= MIN_AGE;
  const plusDisabled = selectedAge >= MAX_AGE;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View style={[styles.badge, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="person-add-outline" size={14} color={theme.primaryDeep} />
            <Text style={[styles.badgeText, { color: theme.primaryDeep }]}>QUICK SETUP</Text>
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Tell us about you</Text>
          <Text style={[styles.subtitle, { color: theme.subText, fontSize: baseFontSize }]}>
            We'll personalize your pantry experience
          </Text>
        </View>

        {/* Age */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border, shadowOpacity: theme.shadowOpacity }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: theme.primarySoft }]}>
              <Ionicons name="calendar-outline" size={16} color={theme.primaryDeep} />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Age</Text>
          </View>

          <View style={styles.ageStepper}>
            <TouchableOpacity
              onPress={() => adjustAge(-1)}
              disabled={minusDisabled}
              activeOpacity={0.7}
              style={[
                styles.stepperBtn,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  opacity: minusDisabled ? 0.4 : 1,
                },
              ]}
            >
              <Ionicons name="remove" size={28} color={theme.text} />
            </TouchableOpacity>

            <View style={styles.ageDisplay}>
              <Text style={[styles.ageNumber, { color: theme.primaryDeep }]}>{selectedAge}</Text>
              <Text style={[styles.ageLabel, { color: theme.subText }]}>years old</Text>
            </View>

            <TouchableOpacity
              onPress={() => adjustAge(1)}
              disabled={plusDisabled}
              activeOpacity={0.85}
              style={[
                styles.stepperBtn,
                {
                  backgroundColor: theme.primaryDeep,
                  borderColor: theme.primaryDeep,
                  opacity: plusDisabled ? 0.4 : 1,
                },
              ]}
            >
              <Ionicons name="add" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text style={[styles.quickLabel, { color: theme.subText }]}>QUICK PICK</Text>
          <View style={styles.quickRow}>
            {QUICK_PICKS.map((age) => {
              const active = selectedAge === age;
              return (
                <TouchableOpacity
                  key={age}
                  onPress={() => setSelectedAge(age)}
                  activeOpacity={0.8}
                  style={[
                    styles.quickPill,
                    {
                      backgroundColor: active ? theme.primarySoft : theme.surface,
                      borderColor: active ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text style={[
                    styles.quickPillText,
                    { color: active ? theme.primaryDeep : theme.text, fontWeight: active ? '800' : '600' },
                  ]}>
                    {age}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Gender */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border, shadowOpacity: theme.shadowOpacity }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="people-outline" size={16} color={theme.accentDeep} />
            </View>
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
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    isActive && { backgroundColor: theme.primarySoft, borderColor: theme.primary },
                  ]}
                  onPress={() => setSelectedGender(g.label)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={g.icon}
                    size={26}
                    color={isActive ? theme.primaryDeep : theme.subText}
                  />
                  <Text style={[
                    styles.genderLabel,
                    { color: isActive ? theme.primaryDeep : theme.text, fontSize: baseFontSize - 2 },
                    isActive && { fontWeight: '700' },
                  ]}>
                    {g.label}
                  </Text>
                  {isActive && (
                    <View style={[styles.checkBadge, { backgroundColor: theme.primaryDeep }]}>
                      <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {isOlderUser && (
          <View style={[styles.hintCard, { backgroundColor: theme.accentSoft, borderColor: theme.accent + '55' }]}>
            <Ionicons name="text-outline" size={16} color={theme.accentDeep} />
            <Text style={[styles.hintText, { color: theme.accentDeep }]}>
              We'll show larger text and clearer reminders for you
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.continueBtn,
            { backgroundColor: theme.primaryDeep, shadowColor: theme.primaryDeep },
            (!selectedGender || saving) && { opacity: 0.45 },
          ]}
          onPress={handleContinue}
          disabled={!selectedGender || saving}
          activeOpacity={0.85}
        >
          <Text style={styles.continueBtnText}>
            {saving ? 'Setting up...' : 'Continue'}
          </Text>
          {!saving && <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipBtn}
          onPress={handleSkip}
          disabled={saving}
          activeOpacity={0.7}
        >
          <Text style={[styles.skipBtnText, { color: theme.subText }]}>Skip for now</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 30 },

  header: { alignItems: 'center', paddingBottom: 20 },
  badge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20, gap: 6, marginBottom: 14,
  },
  badgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 8, letterSpacing: 0.3 },
  subtitle: { textAlign: 'center', marginBottom: 8, lineHeight: 21, fontWeight: '500' },

  section: {
    borderRadius: 18, padding: 20, marginBottom: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 3,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  sectionIcon: {
    width: 30, height: 30, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },

  // Age stepper
  ageStepper: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: 16, marginBottom: 20,
  },
  stepperBtn: {
    width: 56, height: 56, borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
  },
  ageDisplay: { flex: 1, alignItems: 'center' },
  ageNumber: { fontSize: 56, fontWeight: '900', lineHeight: 60, letterSpacing: 0.5 },
  ageLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, marginTop: 2 },

  // Quick picks
  quickLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10 },
  quickRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  quickPill: {
    flex: 1, minWidth: 50,
    paddingVertical: 10, borderRadius: 12, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  quickPillText: { fontSize: 15 },

  // Gender
  genderGrid: { flexDirection: 'row', gap: 10 },
  genderCard: {
    flex: 1, borderRadius: 14, borderWidth: 1.5, padding: 14,
    alignItems: 'center', gap: 8, position: 'relative',
    minHeight: 90, justifyContent: 'center',
  },
  genderLabel: { textAlign: 'center', fontWeight: '600' },
  checkBadge: {
    position: 'absolute', top: 6, right: 6,
    width: 20, height: 20, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },

  hintCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 14,
  },
  hintText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: '600' },

  continueBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderRadius: 16, marginTop: 8,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  continueBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  skipBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  skipBtnText: { fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
});
