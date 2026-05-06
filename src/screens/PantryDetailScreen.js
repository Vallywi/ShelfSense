import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../config/ThemeContext';
import { useAuth } from '../config/AuthContext';
import { fetchPantryDetail, removeMemberAPI } from '../services/api';
import { getStatus } from '../services/ai';

const getStatusColor = (status) => {
  switch (status) {
    case 'safe': return '#27ae60';
    case 'soon': return '#f39c12';
    case 'urgent': return '#e67e22';
    case 'expired': return '#e74c3c';
    default: return '#27ae60';
  }
};

export default function PantryDetailScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  const { pantryId, pantryName } = route.params;

  const [pantry, setPantry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchPantryDetail(pantryId);
      setPantry(data.pantry);
      setLastUpdated(new Date());
    } catch (e) {
      console.warn('Load pantry detail error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [pantryId]);

  const handleRemoveMember = async (memberId) => {
    const isSelf = memberId === currentUser?.id;
    const confirmMsg = isSelf 
      ? 'Are you sure you want to leave this pantry?' 
      : 'Are you sure you want to kick this member?';
    
    if (Platform.OS === 'web' ? window.confirm(confirmMsg) : true) {
      try {
        await removeMemberAPI(pantryId, memberId);
        if (isSelf) {
          navigation.navigate('Main', { screen: 'Pantries' });
        } else {
          load();
        }
      } catch (e) {
        alert(e.message);
      }
    }
  };

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 5s
  useEffect(() => {
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!pantry) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.subText }}>Pantry not found</Text>
      </View>
    );
  }

  const isOwner = pantry.ownerId === currentUser?.id;
  const members = pantry.members || [];
  const items = (pantry.items || []).map(i => ({ ...i, status: getStatus(i.expiryDate) }));

  const timeAgo = lastUpdated ? (() => {
    const diff = Math.round((new Date() - lastUpdated) / 1000);
    if (diff < 10) return 'Updated just now';
    if (diff < 60) return `Updated ${diff}s ago`;
    return `Updated ${Math.round(diff / 60)}m ago`;
  })() : '';

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={theme.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.text }]}>{pantry.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <View style={[styles.codeBadge, { backgroundColor: theme.primary + '18' }]}>
                <Ionicons name="key-outline" size={12} color={theme.primary} />
                <Text style={[styles.codeText, { color: theme.primary }]}> {pantry.inviteCode}</Text>
              </View>
              {isOwner ? (
                <View style={[styles.ownerTag, { backgroundColor: '#f39c1222' }]}>
                  <Text style={{ color: '#f39c12', fontSize: 11, fontWeight: '700' }}>👑 Owner</Text>
                </View>
              ) : (
                <TouchableOpacity 
                  onPress={() => handleRemoveMember(currentUser?.id)}
                  style={[styles.leaveBtn, { backgroundColor: theme.warning + '18' }]}
                >
                  <Text style={{ color: theme.warning, fontSize: 11, fontWeight: '700' }}>Leave Pantry</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Sync indicator */}
        {timeAgo ? (
          <View style={[styles.syncBar, { backgroundColor: theme.card }]}>
            <Ionicons name="sync-outline" size={14} color={theme.primary} />
            <Text style={{ color: theme.subText, fontSize: 12, marginLeft: 6 }}>{timeAgo}</Text>
          </View>
        ) : null}

        {/* Members */}
        <Text style={[styles.sectionTitle, { color: theme.subText }]}>MEMBERS ({members.length})</Text>
        <View style={[styles.membersCard, { backgroundColor: theme.card }]}>
          {members.map((m) => (
            <View key={m.userId} style={styles.memberRow}>
              <View style={[styles.memberAvatar, { backgroundColor: theme.primary + '22' }]}>
                <Text style={{ color: theme.primary, fontWeight: '800', fontSize: 14 }}>
                  {(m.name || '?').substring(0, 2).toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.memberName, { color: theme.text }]}>{m.name}</Text>
              {m.userId === pantry.ownerId ? (
                <View style={[styles.ownerTag, { backgroundColor: '#f39c1222' }]}>
                  <Text style={{ color: '#f39c12', fontSize: 10, fontWeight: '700' }}>Owner</Text>
                </View>
              ) : isOwner && (
                <TouchableOpacity 
                  onPress={() => handleRemoveMember(m.userId)}
                  style={styles.kickBtn}
                >
                  <Ionicons name="person-remove-outline" size={18} color={theme.warning} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Items */}
        <Text style={[styles.sectionTitle, { color: theme.subText }]}>ITEMS ({items.length})</Text>
        {items.length === 0 ? (
          <View style={[styles.emptyItems, { backgroundColor: theme.card }]}>
            <Ionicons name="basket-outline" size={40} color={theme.border} />
            <Text style={{ color: theme.subText, marginTop: 8 }}>No items yet. Add from the home screen!</Text>
          </View>
        ) : (
          items.map((item) => (
            <View key={item.id} style={[styles.itemCard, { backgroundColor: theme.card }]}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemName, { color: theme.text }]}>{item.name}</Text>
                <Text style={{ color: theme.subText, fontSize: 12, marginTop: 2 }}>
                  {item.category} • Expires: {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}
                </Text>
                <Text style={{ color: theme.subText, fontSize: 11, marginTop: 2, fontStyle: 'italic' }}>
                  Added by {item.createdByName || 'Unknown'}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '22' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                  {item.status?.toUpperCase()}
                </Text>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 12 },
  backBtn: { padding: 8 },
  title: { fontSize: 24, fontWeight: '800' },
  codeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  codeText: { fontSize: 13, fontWeight: '700', fontFamily: 'monospace' },
  ownerTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  leaveBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  kickBtn: { padding: 8 },
  syncBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, padding: 10, borderRadius: 10, marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginHorizontal: 20, marginBottom: 10, marginTop: 8 },
  membersCard: { marginHorizontal: 16, borderRadius: 16, padding: 12, marginBottom: 20 },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12 },
  memberAvatar: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  memberName: { fontSize: 15, fontWeight: '600', flex: 1 },
  emptyItems: { alignItems: 'center', padding: 30, marginHorizontal: 16, borderRadius: 16 },
  itemCard: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 10,
    padding: 14, borderRadius: 14, gap: 12,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  itemName: { fontSize: 16, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: '800' },
});
