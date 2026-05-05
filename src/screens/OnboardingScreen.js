import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ImageBackground,
  Animated, ScrollView, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../config/AuthContext';

const FEATURES = [
  { icon: 'scan-outline', title: 'Smart Scanner', desc: 'Scan barcodes & expiry dates instantly', color: '#2ECC71', bg: '#2ECC7122' },
  { icon: 'leaf-outline', title: 'Reduce Waste', desc: 'Get notified before food expires', color: '#F39C12', bg: '#F39C1222' },
  { icon: 'restaurant-outline', title: 'Recipe Ideas', desc: 'Cook with what you already have', color: '#3498DB', bg: '#3498DB22' },
];

export default function OnboardingScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Animation refs
  const logoAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(formAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSubmit = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (mode === 'register') {
      if (!name.trim()) { setError('Please enter your name'); return; }
      if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
      if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register(name.trim(), email.trim(), password);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <ImageBackground
      source={require('../../assets/pantry_background.png')}
      style={styles.bg}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* ── Logo & Hero ── */}
          <Animated.View style={[styles.heroSection, { opacity: logoAnim, transform: [{ translateY: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) }] }]}>
            <View style={styles.iconBadge}>
              <Ionicons name="layers" size={36} color="#2ECC71" />
            </View>
            <Text style={styles.appName}>ShelfSense</Text>
            <Text style={styles.tagline}>Your smart kitchen companion</Text>
          </Animated.View>

          {/* ── Features (only on login view) ── */}
          {mode === 'login' && (
            <View style={styles.featureList}>
              {FEATURES.map((f) => (
                <View key={f.title} style={[styles.featureCard, { borderLeftColor: f.color }]}>
                  <View style={[styles.featureIcon, { backgroundColor: f.bg }]}>
                    <Ionicons name={f.icon} size={22} color={f.color} />
                  </View>
                  <View style={styles.featureText}>
                    <Text style={styles.featureTitle}>{f.title}</Text>
                    <Text style={styles.featureDesc}>{f.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ── Auth Form ── */}
          <Animated.View style={[styles.formCard, { opacity: formAnim, transform: [{ translateY: formAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }]}>
            <Text style={styles.formTitle}>
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </Text>
            <Text style={styles.formSubtitle}>
              {mode === 'login' ? 'Sign in to access your pantry' : 'Register to start tracking your food'}
            </Text>

            {/* Error message */}
            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#e74c3c" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Name (register only) */}
            {mode === 'register' && (
              <View style={styles.inputGroup}>
                <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="#888"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}

            {/* Email */}
            <View style={styles.inputGroup}>
              <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#888"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Password"
                placeholderTextColor="#888"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#888" />
              </TouchableOpacity>
            </View>

            {/* Confirm Password (register only) */}
            {mode === 'register' && (
              <View style={styles.inputGroup}>
                <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="#888"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                />
              </View>
            )}

            {/* Submit button */}
            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name={mode === 'login' ? 'log-in-outline' : 'person-add-outline'} size={22} color="#fff" />
                  <Text style={styles.submitBtnText}>
                    {mode === 'login' ? 'Log In' : 'Create Account'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Toggle mode */}
            <TouchableOpacity onPress={toggleMode} style={styles.toggleRow}>
              <Text style={styles.toggleText}>
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <Text style={styles.toggleLink}>
                  {mode === 'login' ? 'Register' : 'Log In'}
                </Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.privacyNote}>🔒 Your data is securely stored</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)' },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 50 },

  heroSection: { alignItems: 'center', marginBottom: 20 },
  iconBadge: {
    width: 76, height: 76, borderRadius: 24,
    backgroundColor: 'rgba(46,204,113,0.18)', borderWidth: 2, borderColor: 'rgba(46,204,113,0.45)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
    shadowColor: '#2ECC71', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 20, elevation: 10,
  },
  appName: {
    fontSize: 42, fontWeight: '900', color: '#fff', letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 12,
  },
  tagline: { fontSize: 14, color: '#2ECC71', fontWeight: '700', letterSpacing: 2, marginTop: 4, textTransform: 'uppercase' },

  featureList: { gap: 10, marginBottom: 24 },
  featureCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14, padding: 14, borderLeftWidth: 3, gap: 12,
  },
  featureIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 2 },
  featureDesc: { fontSize: 12, color: 'rgba(255,255,255,0.65)' },

  // ── Form ──
  formCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  formTitle: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 6 },
  formSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 20 },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(231,76,60,0.15)', borderRadius: 10, padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(231,76,60,0.3)',
  },
  errorText: { color: '#e74c3c', fontSize: 13, fontWeight: '600', flex: 1 },

  inputGroup: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, paddingHorizontal: 14,
    marginBottom: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#fff', fontSize: 16, paddingVertical: 16 },
  eyeBtn: { padding: 8 },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#2ECC71', paddingVertical: 18, borderRadius: 50, gap: 10, marginTop: 6,
    shadowColor: '#2ECC71', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 12,
  },
  submitBtnText: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },

  toggleRow: { alignItems: 'center', marginTop: 18 },
  toggleText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  toggleLink: { color: '#2ECC71', fontWeight: '700' },

  privacyNote: { marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.45)', textAlign: 'center' },
});
