import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../config/ThemeContext';
import { useAuth } from '../config/AuthContext';
import { fetchPantryDetail, removeMemberAPI } from '../services/api';
import { getStatus } from '../services/ai';

const getStatusColor = (status, theme) => {
  switch (status) {
    case 'safe': return theme.safe;
    case 'soon': return theme.warning;
    case 'urgent': return '#E89274';
    case 'expired': return theme.danger;
    default: return theme.safe;
  }
};

export default function PantryDetailScreen({ route, navigation }) {
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  const { pantryId } = route.params;

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

  useEffect(() => {
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primaryDeep} />
      </View>
    );
  }

  if (!pantry) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.subText, fontWeight: '500' }}>Pantry not found</Text>
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
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={theme.primaryDeep}
            colors={[theme.primaryDeep]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{pantry.name}</Text>
            <View style={styles.headerMeta}>
              <View style={[styles.codeBadge, { backgroundColor: theme.primarySoft }]}>
                <Ionicons name="key-outline" size={12} color={theme.primaryDeep} />
                <Text style={[styles.codeText, { color: theme.primaryDeep }]}>{pantry.inviteCode}</Text>
              </View>
              {isOwner ? (
                <View style={[styles.ownerTag, { backgroundColor: theme.accentSoft }]}>
                  <Ionicons name="star" size={10} color={theme.accentDeep} />
                  <Text style={[styles.ownerTagText, { color: theme.accentDeep }]}>Owner</Text>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => handleRemoveMember(currentUser?.id)}
                  style={[styles.leaveBtn, { backgroundColor: theme.warningSoft, borderColor: theme.warning + '55' }]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.leaveBtnText, { color: theme.warning }]}>Leave</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Sync indicator */}
        {timeAgo ? (
          <View style={[styles.syncBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="sync-outline" size={13} color={theme.primaryDeep} />
            <Text style={{ color: theme.subText, fontSize: 12, marginLeft: 6, fontWeight: '500' }}>{timeAgo}</Text>
          </View>
        ) : null}

        {/* Members */}
        <Text style={[styles.sectionTitle, { color: theme.subText }]}>MEMBERS ({members.length})</Text>
        <View style={[styles.membersCard, { backgroundColor: theme.card, borderColor: theme.border, shadowOpacity: theme.shadowOpacity }]}>
          {members.map((m, idx) => (
            <View
              key={m.userId}
              style={[
                styles.memberRow,
                idx !== members.length - 1 && { borderBottomColor: theme.divider, borderBottomWidth: 1 },
              ]}
            >
              <View style={[styles.memberAvatar, { backgroundColor: theme.primarySoft }]}>
                <Text style={{ color: theme.primaryDeep, fontWeight: '800', fontSize: 13 }}>
                  {(m.name || '?').substring(0, 2).toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.memberName, { color: theme.text }]} numberOfLines={1}>{m.name}</Text>
              {m.userId === pantry.ownerId ? (
                <View style={[styles.ownerTag, { backgroundColor: theme.accentSoft }]}>
                  <Ionicons name="star" size={9} color={theme.accentDeep} />
                  <Text style={[styles.ownerTagText, { color: theme.accentDeep }]}>Owner</Text>
                </View>
              ) : isOwner && (
                <TouchableOpacity
                  onPress={() => handleRemoveMember(m.userId)}
                  style={[styles.kickBtn, { backgroundColor: theme.warningSoft }]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="person-remove-outline" size={16} color={theme.warning} />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Items */}
        <Text style={[styles.sectionTitle, { color: theme.subText }]}>ITEMS ({items.length})</Text>
        {items.length === 0 ? (
          <View style={[styles.emptyItems, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.emptyIconBg, { backgroundColor: theme.primarySoft }]}>
              <Ionicons name="basket-outline" size={36} color={theme.primary} />
            </View>
            <Text style={{ color: theme.text, marginTop: 12, fontWeight: '700', fontSize: 15 }}>No items yet</Text>
            <Text style={{ color: theme.subText, marginTop: 6, fontSize: 13, textAlign: 'center' }}>
              Add items from the home screen
            </Text>
          </View>
        ) : (
          items.map((item) => {
            const statusColor = getStatusColor(item.status, theme);
            return (
              <View
                key={item.id}
                style={[styles.itemCard, { backgroundColor: theme.card, borderColor: theme.border, shadowOpacity: theme.shadowOpacity }]}
              >
                <View style={[styles.statusBar, { backgroundColor: statusColor }]} />
                <View style={{ flex: 1, paddingVertical: 14, paddingHorizontal: 14 }}>
                  <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                  <Text style={{ color: theme.subText, fontSize: 12, marginTop: 3, fontWeight: '500' }}>
                    {item.category} · {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}
                  </Text>
                  <Text style={{ color: theme.subText, fontSize: 11, marginTop: 2, fontStyle: 'italic' }}>
                    Added by {item.createdByName || 'Unknown'}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {item.status?.toUpperCase()}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 12 },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
  },
  title: { fontSize: 22, fontWeight: '800' },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  codeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  codeText: { fontSize: 12, fontWeight: '700', fontFamily: 'monospace', letterSpacing: 0.5 },
  ownerTag: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
  },
  ownerTagText: { fontSize: 11, fontWeight: '700' },
  leaveBtn: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
    borderWidth: 1,
  },
  leaveBtnText: { fontSize: 11, fontWeight: '700' },
  kickBtn: { padding: 8, borderRadius: 10 },

  syncBar: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, marginBottom: 16, alignSelf: 'flex-start',
    borderWidth: 1,
  },

  sectionTitle: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.2,
    marginHorizontal: 20, marginBottom: 10, marginTop: 4,
  },

  membersCard: {
    marginHorizontal: 16, borderRadius: 16, padding: 4,
    marginBottom: 20, borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 1,
  },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, gap: 12 },
  memberAvatar: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  memberName: { fontSize: 14, fontWeight: '600', flex: 1 },

  emptyItems: {
    alignItems: 'center', paddingVertical: 32, paddingHorizontal: 30,
    marginHorizontal: 16, borderRadius: 16, borderWidth: 1,
  },
  emptyIconBg: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center',
  },

  itemCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 10, borderRadius: 14,
    overflow: 'hidden', borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 1,
  },
  statusBar: { width: 4, alignSelf: 'stretch' },
  itemName: { fontSize: 15, fontWeight: '700' },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 10, marginRight: 12,
  },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
});
