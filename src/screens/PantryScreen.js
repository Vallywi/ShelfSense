import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Alert, Platform, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../config/ThemeContext';
import { useAuth } from '../config/AuthContext';
import {
  fetchPantries, createPantry, joinPantry, deletePantry,
} from '../services/api';

export default function PantryScreen({ navigation }) {
  const { theme } = useTheme();
  const { currentUser } = useAuth();

  const [pantries, setPantries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newPantryName, setNewPantryName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadPantries = useCallback(async () => {
    try {
      const data = await fetchPantries();
      setPantries(data.pantries || []);
    } catch (e) {
      console.warn('Load pantries error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadPantries(); }, [loadPantries]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(loadPantries, 5000);
    return () => clearInterval(interval);
  }, [loadPantries]);

  const handleCreate = async () => {
    if (!newPantryName.trim()) return;
    setSaving(true);
    setError('');
    try {
      await createPantry(newPantryName.trim());
      await loadPantries();
      setNewPantryName('');
      setShowCreateModal(false);
    } catch (e) {
      setError(e.message);
    }
    setSaving(false);
  };

  const handleJoin = async () => {
    if (joinCode.trim().length < 4) return;
    setSaving(true);
    setError('');
    try {
      await joinPantry(joinCode.trim());
      await loadPantries();
      setJoinCode('');
      setShowJoinModal(false);
    } catch (e) {
      setError(e.message);
      if (Platform.OS === 'web') {
        window.alert(e.message);
      } else {
        Alert.alert('Error', e.message);
      }
    }
    setSaving(false);
  };

  const handleDelete = async (pantryId) => {
    const doDelete = async () => {
      try {
        await deletePantry(pantryId);
        await loadPantries();
      } catch (e) {
        const msg = e.message || 'Failed to delete';
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('Error', msg);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Delete this pantry? All items will be removed.')) doDelete();
    } else {
      Alert.alert('Delete Pantry', 'All items will be removed.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ color: theme.subText, marginTop: 12 }}>Loading pantries...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadPantries(); }} tintColor={theme.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Your Pantries</Text>
          <Text style={[styles.subtitle, { color: theme.subText }]}>
            {pantries.length === 0 ? 'Create or join a pantry to get started' : `${pantries.length} pantry${pantries.length !== 1 ? 's' : ''} connected`}
          </Text>
        </View>

        {/* Pantry List */}
        {pantries.map((pantry) => {
          const isOwner = pantry.ownerId === currentUser?.id;
          return (
            <TouchableOpacity
              key={pantry.id}
              style={[styles.pantryCard, { backgroundColor: theme.card }]}
              onPress={() => navigation.navigate('PantryDetail', { pantryId: pantry.id, pantryName: pantry.name })}
              activeOpacity={0.8}
            >
              <View style={[styles.pantryIcon, { backgroundColor: theme.primary + '22' }]}>
                <Ionicons name="home" size={28} color={theme.primary} />
              </View>
              <View style={styles.pantryInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={[styles.pantryName, { color: theme.text }]}>{pantry.name}</Text>
                  {isOwner && (
                    <View style={[styles.ownerBadge, { backgroundColor: theme.primary + '22' }]}>
                      <Text style={[styles.ownerBadgeText, { color: theme.primary }]}>Owner</Text>
                    </View>
                  )}
                </View>
                <View style={styles.pantryMeta}>
                  <View style={[styles.codeBadge, { backgroundColor: theme.background }]}>
                    <Ionicons name="key-outline" size={12} color={theme.subText} />
                    <Text style={[styles.codeText, { color: theme.subText }]}> {pantry.inviteCode}</Text>
                  </View>
                  <Text style={[styles.memberCount, { color: theme.subText }]}>
                    👥 {pantry.members?.length || 1} member{(pantry.members?.length || 1) !== 1 ? 's' : ''}
                  </Text>
                  <Text style={[styles.memberCount, { color: theme.subText }]}>
                    📦 {pantry.itemCount || 0} items
                  </Text>
                </View>
              </View>
              {isOwner && (
                <TouchableOpacity onPress={() => handleDelete(pantry.id)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                </TouchableOpacity>
              )}
              <Ionicons name="chevron-forward" size={20} color={theme.subText} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          );
        })}

        {/* Empty State */}
        {pantries.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 60 }}>🏠</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Pantries Yet</Text>
            <Text style={[styles.emptySubtitle, { color: theme.subText }]}>
              Create a private pantry or join one with an invite code
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
            onPress={() => { setError(''); setShowCreateModal(true); }}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle-outline" size={22} color="#fff" />
            <Text style={styles.primaryBtnText}>Create New Pantry</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: theme.primary, backgroundColor: theme.card }]}
            onPress={() => { setError(''); setShowJoinModal(true); }}
            activeOpacity={0.85}
          >
            <Ionicons name="people-outline" size={22} color={theme.primary} />
            <Text style={[styles.secondaryBtnText, { color: theme.primary }]}>Join a Pantry</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Create Pantry Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.card }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>Create a New Pantry</Text>
            <Text style={[styles.modalSubtitle, { color: theme.subText }]}>Give your pantry a name and share the invite code</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
              placeholder="e.g. Home Pantry, Dorm Room..."
              placeholderTextColor={theme.subText}
              value={newPantryName}
              onChangeText={setNewPantryName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalCancel, { borderColor: theme.border }]} onPress={() => setShowCreateModal(false)}>
                <Text style={[styles.modalCancelText, { color: theme.subText }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, { backgroundColor: theme.primary }, (!newPantryName.trim() || saving) && { opacity: 0.5 }]}
                onPress={handleCreate}
                disabled={!newPantryName.trim() || saving}
              >
                <Text style={styles.modalConfirmText}>{saving ? 'Creating…' : 'Create'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Join Pantry Modal */}
      <Modal visible={showJoinModal} transparent animationType="slide" onRequestClose={() => setShowJoinModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.card }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>Join a Pantry</Text>
            <Text style={[styles.modalSubtitle, { color: theme.subText }]}>Enter the 6-character invite code from the pantry owner</Text>
            <TextInput
              style={[styles.modalInput, styles.codeInput, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
              placeholder="e.g. ABC123"
              placeholderTextColor={theme.subText}
              value={joinCode}
              onChangeText={setJoinCode}
              autoCapitalize="characters"
              maxLength={6}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalCancel, { borderColor: theme.border }]} onPress={() => setShowJoinModal(false)}>
                <Text style={[styles.modalCancelText, { color: theme.subText }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, { backgroundColor: theme.primary }, (joinCode.length < 4 || saving) && { opacity: 0.5 }]}
                onPress={handleJoin}
                disabled={joinCode.length < 4 || saving}
              >
                <Text style={styles.modalConfirmText}>{saving ? 'Joining…' : 'Join'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 24, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: 0.3 },
  subtitle: { fontSize: 14, marginTop: 4 },
  pantryCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 12,
    padding: 16, borderRadius: 16,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4,
  },
  pantryIcon: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  pantryInfo: { flex: 1 },
  pantryName: { fontSize: 17, fontWeight: '700', marginBottom: 6 },
  ownerBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  ownerBadgeText: { fontSize: 11, fontWeight: '700' },
  pantryMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  codeBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  codeText: { fontSize: 12, fontFamily: 'monospace', fontWeight: '600' },
  memberCount: { fontSize: 12 },
  deleteBtn: { padding: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginTop: 12 },
  emptySubtitle: { fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 22 },
  actions: { padding: 16, gap: 12 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 18, borderRadius: 14, gap: 10,
    elevation: 4, shadowColor: '#2ECC71', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6,
  },
  primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 18, borderRadius: 14, borderWidth: 2, gap: 10,
  },
  secondaryBtnText: { fontSize: 17, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#ccc', alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, lineHeight: 20, marginBottom: 20 },
  modalInput: { borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 20 },
  codeInput: { textAlign: 'center', fontSize: 24, fontWeight: '800', letterSpacing: 6 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, borderWidth: 1.5, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  modalCancelText: { fontSize: 16, fontWeight: '600' },
  modalConfirm: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  modalConfirmText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
