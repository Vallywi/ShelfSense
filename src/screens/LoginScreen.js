import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../config/AuthContext';
import { useTheme } from '../config/ThemeContext';

export default function LoginScreen({ navigation }) {
  const { theme } = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
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

        {/* Hero block */}
        <View style={styles.hero}>
          <View style={[styles.heroBackdrop, { backgroundColor: theme.primarySoft }]} />
          <View style={[styles.heroAccent, { backgroundColor: theme.accentSoft }]} />
          <View style={[styles.heroLogo, { backgroundColor: theme.primaryDeep, shadowColor: theme.primaryDeep }]}>
            <Ionicons name="leaf" size={32} color="#FFFFFF" />
          </View>
          <View style={[styles.heroBadgeTopLeft, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="basket" size={14} color={theme.primaryDeep} />
          </View>
          <View style={[styles.heroBadgeBottomRight, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="sparkles" size={14} color={theme.accentDeep} />
          </View>
        </View>

        <View style={styles.header}>
          <Text style={[styles.brandLabel, { color: theme.primaryDeep }]}>SHELFSENSE</Text>
          <Text style={[styles.title, { color: theme.text }]}>Welcome back</Text>
          <Text style={[styles.subtitle, { color: theme.subText }]}>Sign in to access your pantry</Text>
        </View>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: theme.dangerSoft, borderColor: theme.danger + '55' }]}>
            <Ionicons name="alert-circle" size={16} color={theme.danger} />
            <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
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

          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.rememberMe}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.checkbox,
                { borderColor: rememberMe ? theme.primaryDeep : theme.borderStrong, backgroundColor: rememberMe ? theme.primaryDeep : 'transparent' },
              ]}>
                {rememberMe && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
              </View>
              <Text style={[styles.rememberText, { color: theme.subText }]}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => {}} activeOpacity={0.7}>
              <Text style={[styles.forgotText, { color: theme.primaryDeep }]}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: theme.primaryDeep, shadowColor: theme.primaryDeep }, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={[styles.divider, { backgroundColor: theme.divider }]} />
            <Text style={[styles.dividerText, { color: theme.subText }]}>or</Text>
            <View style={[styles.divider, { backgroundColor: theme.divider }]} />
          </View>

          <TouchableOpacity
            style={[styles.registerRow, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.85}
          >
            <Text style={[styles.registerText, { color: theme.subText }]}>
              New here? <Text style={[styles.registerLink, { color: theme.primaryDeep }]}>Create an account</Text>
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 28, justifyContent: 'center', paddingTop: 60, paddingBottom: 40 },

  hero: {
    width: 130, height: 130, alignSelf: 'center', marginBottom: 22,
    position: 'relative',
  },
  heroBackdrop: {
    position: 'absolute', top: 10, left: 10, width: 110, height: 110, borderRadius: 32,
    transform: [{ rotate: '-8deg' }],
  },
  heroAccent: {
    position: 'absolute', top: 0, right: 0, width: 70, height: 70, borderRadius: 24,
    transform: [{ rotate: '10deg' }],
  },
  heroLogo: {
    position: 'absolute', top: 20, left: 25, width: 80, height: 80, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  heroBadgeTopLeft: {
    position: 'absolute', top: 4, left: 0, width: 32, height: 32, borderRadius: 12,
    borderWidth: 1, justifyContent: 'center', alignItems: 'center',
  },
  heroBadgeBottomRight: {
    position: 'absolute', bottom: 4, right: 4, width: 32, height: 32, borderRadius: 12,
    borderWidth: 1, justifyContent: 'center', alignItems: 'center',
  },
  brandLabel: {
    fontSize: 11, fontWeight: '800', letterSpacing: 2.5, marginBottom: 8,
  },
  header: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 30, fontWeight: '800', marginBottom: 8, letterSpacing: 0.3 },
  subtitle: { fontSize: 14, fontWeight: '500' },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1,
  },
  errorText: { fontSize: 13, fontWeight: '600', flex: 1 },

  form: { gap: 14 },
  inputGroup: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, paddingHorizontal: 16, height: 56,
    borderWidth: 1,
  },
  input: { flex: 1, fontSize: 15, fontWeight: '500' },

  optionsRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 4, marginBottom: 4,
  },
  rememberMe: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: {
    width: 20, height: 20, borderRadius: 6, borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center',
  },
  rememberText: { fontSize: 13, fontWeight: '500' },
  forgotText: { fontWeight: '700', fontSize: 13 },

  loginBtn: {
    height: 56, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginTop: 14,
    elevation: 5,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10,
  },
  loginBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 14 },
  divider: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },

  registerRow: {
    alignItems: 'center', paddingVertical: 14,
    borderRadius: 14, borderWidth: 1,
  },
  registerText: { fontSize: 14, fontWeight: '500' },
  registerLink: { fontWeight: '700' },
});
