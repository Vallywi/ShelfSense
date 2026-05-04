import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { subscribeToItems, deleteItem } from '../services/firestore';
import { getRecommendation } from '../services/ai';

const getStatusColor = (status) => {
  switch (status) {
    case 'safe': return '#27ae60';
    case 'soon': return '#f39c12';
    case 'urgent': return '#e67e22';
    case 'expired': return '#e74c3c';
    default: return '#27ae60';
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'safe': return 'checkmark-circle';
    case 'soon': return 'warning';
    case 'urgent': return 'alert-circle';
    case 'expired': return 'close-circle';
    default: return 'checkmark-circle';
  }
};

export default function HomeScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToItems((fetchedItems) => {
      setItems(fetchedItems);
      setLoading(false);
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  const expiringSoonCount = items.filter(i => i.status === 'soon' || i.status === 'urgent').length;
  const expiredCount = items.filter(i => i.status === 'expired').length;
  const todayCount = items.filter(i => {
    const diff = (new Date(i.expiryDate) - new Date()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 1;
  }).length;

  const handleDelete = (item) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to remove "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteItem(item.id);
            } catch (err) {
              Alert.alert('Error', 'Failed to delete item.');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => {
    const recommendation = getRecommendation(item);
    return (
      <TouchableOpacity
        style={styles.card}
        onLongPress={() => handleDelete(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardLeft}>
          <Ionicons name={getStatusIcon(item.status)} size={28} color={getStatusColor(item.status)} />
        </View>
        <View style={styles.cardCenter}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemCategory}>{item.category}</Text>
          <Text style={styles.itemDate}>Expires: {new Date(item.expiryDate).toLocaleDateString()}</Text>
          <Text style={[styles.recommendation, { color: getStatusColor(item.status) }]}>💡 {recommendation}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Smart Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { borderLeftColor: '#2ECC71' }]}>
          <Text style={styles.summaryNumber}>{items.length}</Text>
          <Text style={styles.summaryLabel}>Total Items</Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftColor: '#f39c12' }]}>
          <Text style={[styles.summaryNumber, { color: '#f39c12' }]}>{expiringSoonCount}</Text>
          <Text style={styles.summaryLabel}>Expiring Soon</Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftColor: '#e74c3c' }]}>
          <Text style={[styles.summaryNumber, { color: '#e74c3c' }]}>{expiredCount}</Text>
          <Text style={styles.summaryLabel}>Expired</Text>
        </View>
      </View>

      {todayCount > 0 && (
        <View style={styles.alertBanner}>
          <Ionicons name="alert-circle" size={20} color="#fff" />
          <Text style={styles.alertBannerText}> {todayCount} item(s) expire today!</Text>
        </View>
      )}

      {items.length === 0 && !loading ? (
        <View style={styles.emptyState}>
          <Ionicons name="basket-outline" size={80} color="#333" />
          <Text style={styles.emptyTitle}>No pantry items yet</Text>
          <Text style={styles.emptySubtitle}>Tap the + button to add your first item</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddGroceries')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  summaryRow: { flexDirection: 'row', paddingHorizontal: 12, paddingTop: 12, gap: 8 },
  summaryCard: {
    flex: 1, backgroundColor: '#1E1E1E', padding: 12, borderRadius: 10,
    borderLeftWidth: 3, alignItems: 'center',
  },
  summaryNumber: { color: '#2ECC71', fontSize: 24, fontWeight: 'bold' },
  summaryLabel: { color: '#888', fontSize: 11, marginTop: 4 },
  alertBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#e74c3c', marginHorizontal: 12, marginTop: 10,
    padding: 10, borderRadius: 8,
  },
  alertBannerText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80 },
  emptyTitle: { color: '#aaa', fontSize: 20, marginTop: 15, fontWeight: 'bold' },
  emptySubtitle: { color: '#666', fontSize: 14, marginTop: 8 },
  list: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 100 },
  card: {
    backgroundColor: '#1E1E1E', padding: 15, borderRadius: 12, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center',
  },
  cardLeft: { marginRight: 12 },
  cardCenter: { flex: 1 },
  itemName: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  itemCategory: { color: '#888', fontSize: 13, marginTop: 2 },
  itemDate: { color: '#bbb', fontSize: 12, marginTop: 4 },
  recommendation: { fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  fab: {
    position: 'absolute', bottom: 25, right: 20, width: 60, height: 60,
    borderRadius: 30, backgroundColor: '#2ECC71', justifyContent: 'center',
    alignItems: 'center', elevation: 8,
    shadowColor: '#2ECC71', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },
});
