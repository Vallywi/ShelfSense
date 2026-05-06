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
import {
  notificationsSupported,
  getPermission,
  requestPermission,
  sendTestNotification,
} from '../services/notifications';

export default function SettingsScreen({ navigation }) {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { currentUser, signOut } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [notifPermission, setNotifPermission] = useState('default');
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
    setNotifPermission(getPermission());
    if (currentUser) {
      setUserProfile({
        age: currentUser.age,
        gender: currentUser.gender,
      });
    }
  }, [currentUser]);

  const toggleNotifications = async (val) => {
    if (val && notificationsSupported()) {
      const result = await requestPermission();
      setNotifPermission(result);
      if (result !== 'granted') {
        if (Platform.OS === 'web') {
          window.alert(
            result === 'denied'
              ? 'Notifications are blocked. Enable them in your browser settings to get expiry alerts.'
              : 'Notification permission was not granted.'
          );
        }
        return;
      }
      sendTestNotification();
    }
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
        gender: editGender,
      };
      if (editPassword) updates.password = editPassword;

      await updateUserProfile(updates);
      setShowEditModal(false);
      alert('Profile updated successfully!');
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

  const displayName = currentUser?.name || '';
  const email = currentUser?.email || '';
  const initials = displayName ? displayName.substring(0, 2).toUpperCase() : (email ? email.substring(0, 2).toUpperCase() : '?');

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingBottom: 60 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.pageTitle, { color: theme.text }]}>Settings</Text>

      {/* Account Card */}
      <TouchableOpacity
        style={[
          styles.accountCard,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
            shadowOpacity: theme.shadowOpacity,
          },
        ]}
        onPress={openEditModal}
        activeOpacity={0.85}
      >
        <View style={[styles.avatarCircle, { backgroundColor: theme.primarySoft }]}>
          <Text style={[styles.avatarInitials, { color: theme.primaryDeep }]}>{initials}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.accountLabel, { color: theme.subText }]}>Signed in as</Text>
          {displayName ? (
            <Text style={[styles.accountName, { color: theme.text }]} numberOfLines={1}>
              {displayName}
            </Text>
          ) : null}
          <Text style={[styles.accountEmail, { color: theme.subText }]} numberOfLines={1}>
            {email}
          </Text>

          {userProfile && (userProfile.age || userProfile.gender) && (
            <View style={styles.tagRow}>
              {userProfile.age ? (
                <View style={[styles.tag, { backgroundColor: theme.primarySoft }]}>
                  <Ionicons name="calendar-outline" size={11} color={theme.primaryDeep} />
                  <Text style={[styles.tagText, { color: theme.primaryDeep }]}>{userProfile.age} yrs</Text>
                </View>
              ) : null}
              {userProfile.gender ? (
                <View style={[styles.tag, { backgroundColor: theme.accentSoft }]}>
                  <Ionicons name="person-outline" size={11} color={theme.accentDeep} />
                  <Text style={[styles.tagText, { color: theme.accentDeep }]}>{userProfile.gender}</Text>
                </View>
              ) : null}
            </View>
          )}
        </View>

        <View style={[styles.editPill, { backgroundColor: theme.primarySoft }]}>
          <Ionicons name="create-outline" size={16} color={theme.primaryDeep} />
        </View>
      </TouchableOpacity>

      {/* Preferences */}
      <Text style={[styles.sectionLabel, { color: theme.subText }]}>PREFERENCES</Text>

      <View style={[styles.group, { backgroundColor: theme.card, borderColor: theme.border, shadowOpacity: theme.shadowOpacity }]}>
        <View style={[styles.row, { borderBottomColor: theme.divider }]}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconBox, { backgroundColor: theme.warningSoft }]}>
              <Ionicons name="notifications" size={20} color={theme.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: theme.text }]}>Notifications</Text>
              <Text style={[styles.rowSub, { color: theme.subText }]}>
                {notifPermission === 'unsupported'
                  ? 'Not supported on this device'
                  : notifPermission === 'denied'
                    ? 'Blocked — enable in browser settings'
                    : notifPermission === 'granted' && notifications
                      ? 'Active — alerts before expiry'
                      : 'Alert me before items expire'}
              </Text>
            </View>
          </View>
          <Switch
            value={notifications && notifPermission !== 'denied' && notifPermission !== 'unsupported'}
            onValueChange={toggleNotifications}
            disabled={notifPermission === 'denied' || notifPermission === 'unsupported'}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor={isDarkMode ? theme.cardElevated : '#FFFFFF'}
            ios_backgroundColor={theme.border}
          />
        </View>

        <View style={[styles.row, { borderBottomColor: 'transparent' }]}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconBox, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name={isDarkMode ? 'moon' : 'sunny'} size={20} color={theme.accentDeep} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: theme.text }]}>Dark Mode</Text>
              <Text style={[styles.rowSub, { color: theme.subText }]}>
                {isDarkMode ? 'Dark theme is on' : 'Light theme is on'}
              </Text>
            </View>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor={isDarkMode ? theme.cardElevated : '#FFFFFF'}
            ios_backgroundColor={theme.border}
          />
        </View>
      </View>

      {/* More */}
      <Text style={[styles.sectionLabel, { color: theme.subText, marginTop: 24 }]}>MORE</Text>

      <View style={[styles.group, { backgroundColor: theme.card, borderColor: theme.border, shadowOpacity: theme.shadowOpacity }]}>
        <TouchableOpacity
          style={[styles.row, { borderBottomColor: theme.divider }]}
          onPress={() => navigation.navigate('Tutorial', { fromSettings: true })}
          activeOpacity={0.7}
        >
          <View style={styles.rowLeft}>
            <View style={[styles.iconBox, { backgroundColor: theme.primarySoft }]}>
              <Ionicons name="school" size={20} color={theme.primaryDeep} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: theme.text }]}>Replay Tutorial</Text>
              <Text style={[styles.rowSub, { color: theme.subText }]}>View the beginner guide again</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.subText} />
        </TouchableOpacity>

        <View style={[styles.row, { borderBottomColor: 'transparent' }]}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconBox, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="information-circle" size={20} color={theme.accentDeep} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: theme.text }]}>App Version</Text>
              <Text style={[styles.rowSub, { color: theme.subText }]}>1.0.0 (MVP)</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Sign Out */}
      <TouchableOpacity
        style={[styles.signOutBtn, { borderColor: theme.danger, backgroundColor: theme.dangerSoft }]}
        onPress={handleSignOut}
        activeOpacity={0.85}
      >
        <Ionicons name="log-out-outline" size={20} color={theme.danger} />
        <Text style={[styles.signOutBtnText, { color: theme.danger }]}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={[styles.version, { color: theme.subText }]}>ShelfSense v1.0.0</Text>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} transparent animationType="fade" onRequestClose={() => setShowEditModal(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Profile</Text>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                style={[styles.modalCloseBtn, { backgroundColor: theme.surface }]}
              >
                <Ionicons name="close" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.subText }]}>Full Name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
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
                    style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
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
                    style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
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
                  style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                  value={editPassword}
                  onChangeText={setEditPassword}
                  secureTextEntry
                  placeholder="Leave blank to keep current"
                  placeholderTextColor={theme.subText}
                />
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: theme.primaryDeep }, saving && { opacity: 0.6 }]}
                onPress={handleUpdateProfile}
                disabled={saving}
                activeOpacity={0.85}
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
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 22,
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 28,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10,
    elevation: 2,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  accountLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginBottom: 3,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  accountEmail: {
    fontSize: 13,
    fontWeight: '500',
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: { fontSize: 11, fontWeight: '700' },
  editPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 10,
    marginLeft: 4,
  },

  group: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
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

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 22, padding: 22, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  modalCloseBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  inputGroup: { marginBottom: 16 },
  inputRow: { flexDirection: 'row', gap: 12 },
  inputLabel: { fontSize: 11, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  input: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 15, fontSize: 15 },
  saveBtn: { height: 54, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
});
