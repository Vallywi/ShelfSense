import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
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

        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </TouchableOpacity>

        <View style={[styles.logoCircle, { backgroundColor: theme.accentSoft }]}>
          <Ionicons name="person-add" size={32} color={theme.accentDeep} />
        </View>

        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: theme.subText }]}>Start tracking your pantry today</Text>
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
            style={styles.loginRow}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <Text style={[styles.loginText, { color: theme.subText }]}>
              Already have an account? <Text style={[styles.loginLink, { color: theme.primaryDeep }]}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 28, justifyContent: 'center', paddingTop: 70, paddingBottom: 40 },

  backButton: {
    position: 'absolute', top: 50, left: 20,
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
  },

  logoCircle: {
    width: 70, height: 70, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    alignSelf: 'center', marginBottom: 20,
  },
  header: { alignItems: 'center', marginBottom: 26 },
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
    height: 56, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginTop: 14,
    elevation: 5,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10,
  },
  registerBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  loginRow: { alignItems: 'center', marginTop: 18 },
  loginText: { fontSize: 13, fontWeight: '500' },
  loginLink: { fontWeight: '700' },
});
