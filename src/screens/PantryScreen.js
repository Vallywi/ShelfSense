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
        <ActivityIndicator size="large" color={theme.primaryDeep} />
        <Text style={{ color: theme.subText, marginTop: 12, fontWeight: '500' }}>Loading pantries...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadPantries(); }}
            tintColor={theme.primaryDeep}
            colors={[theme.primaryDeep]}
          />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Your Pantries</Text>
          <Text style={[styles.subtitle, { color: theme.subText }]}>
            {pantries.length === 0
              ? 'Create or join a pantry to get started'
              : `${pantries.length} pantry${pantries.length !== 1 ? 's' : ''} connected`}
          </Text>
        </View>

        {pantries.map((pantry) => {
          const isOwner = pantry.ownerId === currentUser?.id;
          return (
            <TouchableOpacity
              key={pantry.id}
              style={[styles.pantryCard, { backgroundColor: theme.card, borderColor: theme.border, shadowOpacity: theme.shadowOpacity }]}
              onPress={() => navigation.navigate('PantryDetail', { pantryId: pantry.id, pantryName: pantry.name })}
              activeOpacity={0.85}
            >
              <View style={[styles.pantryIcon, { backgroundColor: theme.primarySoft }]}>
                <Ionicons name="home" size={26} color={theme.primaryDeep} />
              </View>
              <View style={styles.pantryInfo}>
                <View style={styles.pantryNameRow}>
                  <Text style={[styles.pantryName, { color: theme.text }]} numberOfLines={1}>{pantry.name}</Text>
                  {isOwner && (
                    <View style={[styles.ownerBadge, { backgroundColor: theme.accentSoft }]}>
                      <Ionicons name="star" size={10} color={theme.accentDeep} />
                      <Text style={[styles.ownerBadgeText, { color: theme.accentDeep }]}>Owner</Text>
                    </View>
                  )}
                </View>
                <View style={styles.pantryMeta}>
                  <View style={[styles.codeBadge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Ionicons name="key-outline" size={11} color={theme.subText} />
                    <Text style={[styles.codeText, { color: theme.subText }]}>{pantry.inviteCode}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="people-outline" size={12} color={theme.subText} />
                    <Text style={[styles.metaText, { color: theme.subText }]}>
                      {pantry.members?.length || 1}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="cube-outline" size={12} color={theme.subText} />
                    <Text style={[styles.metaText, { color: theme.subText }]}>
                      {pantry.itemCount || 0} items
                    </Text>
                  </View>
                </View>
              </View>
              {isOwner && (
                <TouchableOpacity onPress={() => handleDelete(pantry.id)} style={styles.deleteBtn} activeOpacity={0.7}>
                  <Ionicons name="trash-outline" size={18} color={theme.danger} />
                </TouchableOpacity>
              )}
              <Ionicons name="chevron-forward" size={20} color={theme.subText} />
            </TouchableOpacity>
          );
        })}

        {pantries.length === 0 && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconBg, { backgroundColor: theme.primarySoft }]}>
              <Ionicons name="home-outline" size={56} color={theme.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Pantries Yet</Text>
            <Text style={[styles.emptySubtitle, { color: theme.subText }]}>
              Create a private pantry or join one with an invite code
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: theme.primaryDeep, shadowColor: theme.primaryDeep }]}
            onPress={() => { setError(''); setShowCreateModal(true); }}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle-outline" size={22} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>Create New Pantry</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: theme.primary, backgroundColor: theme.primarySoft }]}
            onPress={() => { setError(''); setShowJoinModal(true); }}
            activeOpacity={0.85}
          >
            <Ionicons name="people-outline" size={22} color={theme.primaryDeep} />
            <Text style={[styles.secondaryBtnText, { color: theme.primaryDeep }]}>Join a Pantry</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Create Pantry Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.modalSheet, { backgroundColor: theme.card }]}>
            <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>Create a New Pantry</Text>
            <Text style={[styles.modalSubtitle, { color: theme.subText }]}>
              Give your pantry a name and share the invite code
            </Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              placeholder="e.g. Home Pantry, Dorm Room..."
              placeholderTextColor={theme.subText}
              value={newPantryName}
              onChangeText={setNewPantryName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalCancel, { borderColor: theme.border, backgroundColor: theme.surface }]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: theme.subText }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirm,
                  { backgroundColor: theme.primaryDeep },
                  (!newPantryName.trim() || saving) && { opacity: 0.5 },
                ]}
                onPress={handleCreate}
                disabled={!newPantryName.trim() || saving}
              >
                <Text style={styles.modalConfirmText}>{saving ? 'Creating...' : 'Create'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Join Pantry Modal */}
      <Modal visible={showJoinModal} transparent animationType="slide" onRequestClose={() => setShowJoinModal(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.modalSheet, { backgroundColor: theme.card }]}>
            <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>Join a Pantry</Text>
            <Text style={[styles.modalSubtitle, { color: theme.subText }]}>
              Enter the 6-character invite code from the pantry owner
            </Text>
            <TextInput
              style={[styles.modalInput, styles.codeInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              placeholder="ABC123"
              placeholderTextColor={theme.subText}
              value={joinCode}
              onChangeText={setJoinCode}
              autoCapitalize="characters"
              maxLength={6}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalCancel, { borderColor: theme.border, backgroundColor: theme.surface }]}
                onPress={() => setShowJoinModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: theme.subText }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirm,
                  { backgroundColor: theme.primaryDeep },
                  (joinCode.length < 4 || saving) && { opacity: 0.5 },
                ]}
                onPress={handleJoin}
                disabled={joinCode.length < 4 || saving}
              >
                <Text style={styles.modalConfirmText}>{saving ? 'Joining...' : 'Join'}</Text>
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
  header: { padding: 22, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: 0.3 },
  subtitle: { fontSize: 14, marginTop: 6, fontWeight: '500' },

  pantryCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 12,
    padding: 14, borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 1,
    gap: 4,
  },
  pantryIcon: {
    width: 50, height: 50, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  pantryInfo: { flex: 1 },
  pantryNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  pantryName: { fontSize: 16, fontWeight: '700', flexShrink: 1 },
  ownerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  ownerBadgeText: { fontSize: 10, fontWeight: '700' },
  pantryMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  codeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    borderWidth: 1,
  },
  codeText: { fontSize: 11, fontFamily: 'monospace', fontWeight: '700', letterSpacing: 0.5 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 12, fontWeight: '500' },
  deleteBtn: { padding: 8 },

  emptyState: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 40 },
  emptyIconBg: {
    width: 110, height: 110, borderRadius: 55,
    justifyContent: 'center', alignItems: 'center', marginBottom: 18,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginTop: 4 },
  emptySubtitle: { fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 22 },

  actions: { padding: 16, gap: 12 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: 14, gap: 10,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: 14, borderWidth: 1.5, gap: 10,
  },
  secondaryBtnText: { fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 22 },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  modalSubtitle: { fontSize: 13, lineHeight: 19, marginBottom: 20, fontWeight: '500' },
  modalInput: { borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 20 },
  codeInput: { textAlign: 'center', fontSize: 22, fontWeight: '800', letterSpacing: 6 },
  modalButtons: { flexDirection: 'row', gap: 10 },
  modalCancel: { flex: 1, borderWidth: 1.5, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  modalCancelText: { fontSize: 15, fontWeight: '600' },
  modalConfirm: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  modalConfirmText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
});
