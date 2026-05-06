import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Switch, TouchableOpacity,
  ScrollView, Alert, Platform, Modal, TextInput
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../config/ThemeContext';
import { useAuth } from '../config/AuthContext';
import { updateUserProfile } from '../services/api';

export default function SettingsScreen({ navigation }) {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { currentUser, signOut } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('appNotifications').then(val => {
      if (val !== null) setNotifications(val === 'true');
    });
    // User profile now comes from currentUser (backend auth)
    if (currentUser) {
      setUserProfile({
        age: currentUser.age,
        gender: currentUser.gender,
      });
    }
  }, [currentUser]);

  const toggleNotifications = async (val) => {
    setNotifications(val);
    await AsyncStorage.setItem('appNotifications', String(val));
  };

  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out? Your data will be saved.')) {
        signOut();
      }
    } else {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out? Your data will be saved.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Out', style: 'destructive', onPress: signOut },
        ]
      );
    }
  };

  const handleUpdateProfile = async () => {
    if (!editName) return alert('Name is required');
    setSaving(true);
    try {
      const updates = { 
        name: editName, 
        age: editAge, 
        gender: editGender 
      };
      if (editPassword) updates.password = editPassword;
      
      await updateUserProfile(updates);
      setShowEditModal(false);
      alert('Profile updated successfully!');
      // Reload or update context if needed (useAuth usually handles state)
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = () => {
    setEditName(currentUser?.name || '');
    setEditAge(String(currentUser?.age || ''));
    setEditGender(currentUser?.gender || '');
    setEditPassword('');
    setShowEditModal(true);
  };

  // Derive display name / initials from user info
  const displayName = currentUser?.name || '';
  const email = currentUser?.email || '';
  const initials = displayName ? displayName.substring(0, 2).toUpperCase() : (email ? email.substring(0, 2).toUpperCase() : '?');

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>

      {/* ── Page Title ── */}
      <Text style={[styles.pageTitle, { color: theme.text }]}>Settings</Text>

      {/* ── Account Card ── */}
      <TouchableOpacity 
        style={[styles.accountCard, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={openEditModal}
        activeOpacity={0.9}
      >
        {/* Avatar */}
        <View style={[styles.avatarCircle, { backgroundColor: theme.primary + '22' }]}>
          <Text style={[styles.avatarInitials, { color: theme.primary }]}>{initials}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.accountLabel, { color: theme.subText }]}>Signed in as</Text>
          {displayName ? (
            <Text style={[styles.accountEmail, { color: theme.text, fontSize: 16 }]} numberOfLines={1}>
              {displayName}
            </Text>
          ) : null}
          <Text style={[styles.accountEmail, { color: displayName ? theme.subText : theme.text, fontSize: displayName ? 13 : 14 }]} numberOfLines={1}>
            {email}
          </Text>

          {/* Profile tags */}
          {userProfile && (
            <View style={styles.tagRow}>
              <View style={[styles.tag, { backgroundColor: theme.primary + '22' }]}>
                <Ionicons name="calendar-outline" size={11} color={theme.primary} />
                <Text style={[styles.tagText, { color: theme.primary }]}>{userProfile.age} yrs</Text>
              </View>
              <View style={[styles.tag, { backgroundColor: theme.primary + '22' }]}>
                <Ionicons name="person-outline" size={11} color={theme.primary} />
                <Text style={[styles.tagText, { color: theme.primary }]}>{userProfile.gender}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Edit Hint */}
        <View style={{ padding: 4 }}>
          <Ionicons name="create-outline" size={20} color={theme.primary} />
        </View>
      </TouchableOpacity>

      {/* ── Settings label ── */}
      <Text style={[styles.sectionLabel, { color: theme.subText }]}>PREFERENCES</Text>

      <View style={[styles.group, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {/* Notifications */}
        <View style={[styles.row, { borderBottomColor: theme.border }]}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconBox, { backgroundColor: '#f39c1222' }]}>
              <Ionicons name="notifications" size={20} color="#f39c12" />
            </View>
            <View>
              <Text style={[styles.rowLabel, { color: theme.text }]}>Notifications</Text>
              <Text style={[styles.rowSub, { color: theme.subText }]}>Alert me before expiry</Text>
            </View>
          </View>
          <Switch
            value={notifications}
            onValueChange={toggleNotifications}
            trackColor={{ false: '#767577', true: theme.primary }}
            thumbColor="#f4f3f4"
          />
        </View>

        {/* Dark mode */}
        <View style={[styles.row, { borderBottomColor: 'transparent' }]}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconBox, { backgroundColor: '#3498db22' }]}>
              <Ionicons name="moon" size={20} color="#3498db" />
            </View>
            <View>
              <Text style={[styles.rowLabel, { color: theme.text }]}>Dark Mode</Text>
              <Text style={[styles.rowSub, { color: theme.subText }]}>Switch theme</Text>
            </View>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{ false: '#767577', true: theme.primary }}
            thumbColor="#f4f3f4"
          />
        </View>
      </View>

      {/* ── More ── */}
      <Text style={[styles.sectionLabel, { color: theme.subText, marginTop: 24 }]}>MORE</Text>

      <View style={[styles.group, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {/* Tutorial */}
        <TouchableOpacity
          style={[styles.row, { borderBottomColor: theme.border }]}
          onPress={() => navigation.navigate('Tutorial', { fromSettings: true })}
          activeOpacity={0.7}
        >
          <View style={styles.rowLeft}>
            <View style={[styles.iconBox, { backgroundColor: '#2ecc7122' }]}>
              <Ionicons name="school" size={20} color="#2ecc71" />
            </View>
            <View>
              <Text style={[styles.rowLabel, { color: theme.text }]}>Replay Tutorial</Text>
              <Text style={[styles.rowSub, { color: theme.subText }]}>View the beginner guide again</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.subText} />
        </TouchableOpacity>

        {/* App version */}
        <View style={[styles.row, { borderBottomColor: 'transparent' }]}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconBox, { backgroundColor: '#8e44ad22' }]}>
              <Ionicons name="information-circle" size={20} color="#8e44ad" />
            </View>
            <View>
              <Text style={[styles.rowLabel, { color: theme.text }]}>App Version</Text>
              <Text style={[styles.rowSub, { color: theme.subText }]}>1.0.0 (MVP)</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Prominent Sign Out button ── */}
      <TouchableOpacity
        style={[styles.signOutBtn, { borderColor: theme.danger || '#e74c3c' }]}
        onPress={handleSignOut}
        activeOpacity={0.8}
      >
        <Ionicons name="log-out" size={20} color={theme.danger || '#e74c3c'} />
        <Text style={[styles.signOutBtnText, { color: theme.danger || '#e74c3c' }]}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={[styles.version, { color: theme.subText }]}>ShelfSense v1.0.0</Text>
      <View style={{ height: 48 }} />

      {/* ── Edit Profile Modal ── */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.subText }]}>Full Name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Enter your name"
                  placeholderTextColor={theme.subText}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: theme.subText }]}>Age</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    value={editAge}
                    onChangeText={setEditAge}
                    keyboardType="numeric"
                    placeholder="e.g. 25"
                    placeholderTextColor={theme.subText}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: theme.subText }]}>Gender</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    value={editGender}
                    onChangeText={setEditGender}
                    placeholder="e.g. Male"
                    placeholderTextColor={theme.subText}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.subText }]}>New Password (Optional)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  value={editPassword}
                  onChangeText={setEditPassword}
                  secureTextEntry
                  placeholder="Leave blank to keep current"
                  placeholderTextColor={theme.subText}
                />
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                onPress={handleUpdateProfile}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },

  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  // ── Account card ──
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 28,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: '800',
  },
  accountLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  accountEmail: {
    fontSize: 14,
    fontWeight: '600',
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: { fontSize: 11, fontWeight: '700' },

  signOutChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  signOutChipText: {
    fontSize: 12,
    fontWeight: '700',
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 10,
  },

  group: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  rowSub: { fontSize: 12, marginTop: 2 },

  // ── Sign out button ──
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 28,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  signOutBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },

  version: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 12,
  },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 25, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  inputGroup: { marginBottom: 16 },
  inputRow: { flexDirection: 'row', gap: 12 },
  inputLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  input: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 15, fontSize: 16 },
  saveBtn: { height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
