import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Image,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../config/AuthContext';
import { useTheme } from '../config/ThemeContext';

export default function RegisterScreen({ navigation }) {
  const { theme } = useTheme();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.hero}>
          <View style={[styles.heroBackdrop, { backgroundColor: theme.primarySoft }]} />
          <View style={[styles.heroAccent, { backgroundColor: theme.accentSoft }]} />
          <View style={[styles.heroLogo, { backgroundColor: '#FFFFFF', shadowColor: theme.primaryDeep }]}>
            <Image
              source={require('../../assets/ShelfSense_Logo.png')}
              style={styles.heroLogoImage}
              resizeMode="contain"
            />
          </View>
          <View style={[styles.heroBadgeTopLeft, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="basket" size={18} color={theme.primaryDeep} />
          </View>
          <View style={[styles.heroBadgeBottomRight, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="sparkles" size={18} color={theme.accentDeep} />
          </View>
        </View>

        <View style={styles.header}>
          <Text style={[styles.brandLabel, { color: theme.primaryDeep }]}>SHELFSENSE</Text>
          <Text style={[styles.title, { color: theme.text }]}>Join us</Text>
          <Text style={[styles.subtitle, { color: theme.subText }]}>Create an account to start tracking</Text>
        </View>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: theme.dangerSoft, borderColor: theme.danger + '55' }]}>
            <Ionicons name="alert-circle" size={16} color={theme.danger} />
            <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <View style={[styles.inputGroup, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="person-outline" size={18} color={theme.subText} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Full name"
              placeholderTextColor={theme.subText}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          <View style={[styles.inputGroup, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="mail-outline" size={18} color={theme.subText} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Email address"
              placeholderTextColor={theme.subText}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={[styles.inputGroup, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="lock-closed-outline" size={18} color={theme.subText} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Password"
              placeholderTextColor={theme.subText}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} activeOpacity={0.7}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.subText} />
            </TouchableOpacity>
          </View>

          <View style={[styles.inputGroup, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="shield-checkmark-outline" size={18} color={theme.subText} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Confirm password"
              placeholderTextColor={theme.subText}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
            />
          </View>

          <TouchableOpacity
            style={[styles.registerBtn, { backgroundColor: theme.primaryDeep, shadowColor: theme.primaryDeep }, loading && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.registerBtnText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginRow, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
          >
            <Text style={[styles.loginText, { color: theme.subText }]}>
              Already a member? <Text style={[styles.loginLink, { color: theme.primaryDeep }]}>Log in</Text>
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 28, justifyContent: 'center', paddingTop: 50, paddingBottom: 40 },

  hero: {
    width: 175, height: 175, alignSelf: 'center', marginBottom: 24,
    position: 'relative',
  },
  heroBackdrop: {
    position: 'absolute', top: 14, left: 14, width: 150, height: 150, borderRadius: 36,
    transform: [{ rotate: '-8deg' }],
  },
  heroAccent: {
    position: 'absolute', top: 0, right: 0, width: 95, height: 95, borderRadius: 28,
    transform: [{ rotate: '10deg' }],
  },
  heroLogo: {
    position: 'absolute', top: 28, left: 35, width: 108, height: 108, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 8,
  },
  heroLogoImage: { width: '130%', height: '130%' },
  heroBadgeTopLeft: {
    position: 'absolute', top: 4, left: 0, width: 40, height: 40, borderRadius: 13,
    borderWidth: 1, justifyContent: 'center', alignItems: 'center',
  },
  heroBadgeBottomRight: {
    position: 'absolute', bottom: 4, right: 4, width: 40, height: 40, borderRadius: 13,
    borderWidth: 1, justifyContent: 'center', alignItems: 'center',
  },
  brandLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 2.5, marginBottom: 8 },
  header: { alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 8, letterSpacing: 0.3 },
  subtitle: { fontSize: 14, fontWeight: '500' },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1,
  },
  errorText: { fontSize: 13, fontWeight: '600', flex: 1 },

  form: { gap: 12 },
  inputGroup: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, paddingHorizontal: 16, height: 54,
    borderWidth: 1,
  },
  input: { flex: 1, fontSize: 15, fontWeight: '500' },

  registerBtn: {
    height: 54, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginTop: 12,
    elevation: 5, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10,
  },
  registerBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  loginRow: {
    alignItems: 'center', paddingVertical: 14, marginTop: 6,
    borderRadius: 14, borderWidth: 1,
  },
  loginText: { fontSize: 14, fontWeight: '500' },
  loginLink: { fontWeight: '700' },
});
