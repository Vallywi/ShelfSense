import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ScrollView, Platform, Image, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { subscribeToItems, deleteItem, updateItemQuantity, consumeItem } from '../services/firestore';
import { getRecommendation, suggestRecipe } from '../services/ai';
import { useTheme } from '../config/ThemeContext';
import { useTutorial } from '../config/TutorialContext';

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

const RECIPE_SUGGESTIONS = [
  { match: ['eggs', 'bread'], meal: 'French Toast', emoji: '🍞' },
  { match: ['milk', 'eggs'], meal: 'Scrambled Eggs', emoji: '🥚' },
  { match: ['chicken', 'garlic'], meal: 'Garlic Chicken', emoji: '🍗' },
  { match: ['pasta', 'tomato'], meal: 'Pasta Sauce', emoji: '🍝' },
  { match: ['banana', 'milk'], meal: 'Banana Smoothie', emoji: '🍌' },
];

function getRecipeSuggestion(items) {
  const names = items.map(i => i.name.toLowerCase());
  for (const recipe of RECIPE_SUGGESTIONS) {
    if (recipe.match.every(ingredient => names.some(n => n.includes(ingredient)))) {
      return recipe;
    }
  }
  return null;
}

function getAIRecommendation(items) {
  const urgent = items.find(i => i.status === 'urgent' || i.status === 'expired');
  const soon = items.find(i => i.status === 'soon');
  
  if (items.length > 0) {
    const recipe = suggestRecipe(items);
    return { 
      text: recipe, 
      icon: 'restaurant-outline', 
      color: urgent ? '#e74c3c' : (soon ? '#f39c12' : '#27ae60'),
      isRecipe: true 
    };
  }
  
  return null;
}

export default function HomeScreen({ navigation }) {
  const { theme } = useTheme();
  const { userProfile } = useTutorial() || {};
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [notifiedItems, setNotifiedItems] = useState(new Set());

  // Personalization: larger fonts for older users
  const isOlderUser = userProfile && parseInt(userProfile.age) >= 50;
  const baseFontSize = isOlderUser ? 15 : 13;
  const itemNameSize = isOlderUser ? 19 : 17;

  useEffect(() => {
    const unsubscribe = subscribeToItems((fetchedItems) => {
      setItems(fetchedItems);
      setLoading(false);
      checkNotifications(fetchedItems);
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  const checkNotifications = async (fetchedItems) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const expiringToday = fetchedItems.filter(item => {
      if (!item.expiryDate) return false;
      const expDate = new Date(item.expiryDate);
      expDate.setHours(0,0,0,0);
      return expDate.getTime() === today.getTime();
    });

    const expiringSoon = fetchedItems.filter(item => {
      if (!item.expiryDate) return false;
      const expDate = new Date(item.expiryDate);
      expDate.setHours(0,0,0,0);
      const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 3;
    });

    if (notifiedItems.size === 0) {
      if (expiringToday.length > 0) {
        const names = expiringToday.map(i => i.name).join(', ');
        Alert.alert(
          '⏰ Urgent: Expires Today!',
          `You have ${expiringToday.length} item(s) expiring today: ${names}. Use them now!`,
          [{ text: 'I\'ll use them', onPress: () => {} }]
        );
        setNotifiedItems(new Set(expiringToday.map(i => i.id)));
      } else if (expiringSoon.length > 0) {
        const names = expiringSoon.map(i => i.name).join(', ');
        Alert.alert(
          '🗓️ Heads Up: Expiring Soon',
          `You have ${expiringSoon.length} item(s) expiring within 3 days: ${names}. Plan your meals accordingly!`,
          [{ text: 'Thanks for the heads up', onPress: () => {} }]
        );
        setNotifiedItems(new Set(expiringSoon.map(i => i.id)));
      }
    }

    // Web-specific browser notifications
    if (Platform.OS === 'web' && ("Notification" in window)) {
      try {
        if (Notification.permission === "default") await Notification.requestPermission();
        if (Notification.permission === "granted") {
          // ... (keep browser notif logic if needed, but the Alert above is more direct for web-app users)
        }
      } catch (e) {}
    }
  };

  const expiringSoonCount = items.filter(i => i.status === 'soon' || i.status === 'urgent').length;
  const expiredCount = items.filter(i => i.status === 'expired').length;
  const todayItems = items.filter(i => {
    const diff = (new Date(i.expiryDate) - new Date()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 1;
  });
  const savedCount = items.filter(i => i.status === 'safe').length;
  const estimatedSaved = (savedCount * 150).toLocaleString(); // ~₱150 per safe item

  const aiRec = getAIRecommendation(items);
  const recipeSuggestion = getRecipeSuggestion(items.filter(i => i.status !== 'expired'));

  const handleDelete = (item) => {
    Alert.alert('Delete Item', `Remove "${item.name}" from your pantry?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try { await deleteItem(item.id); } catch { Alert.alert('Error', 'Failed to delete item.'); }
        }
      }
    ]);
  };

  const renderItem = ({ item }) => {
    const recommendation = getRecommendation(item);
    const initial = (item.name || '?').charAt(0).toUpperCase();
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.card }]}
        onPress={() => { setSelectedItem(item); setShowDetail(true); }}
        activeOpacity={0.8}
      >
        {/* Product Image or Letter Avatar */}
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.productThumb}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.avatar, { backgroundColor: theme.primary + '22' }]}>
            <Text style={[styles.avatarText, { color: theme.primary }]}>{initial}</Text>
          </View>
        )}

        <View style={styles.cardCenter}>
          <Text style={[styles.itemName, { color: theme.text, fontSize: itemNameSize }]}>{item.name}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
            <Text style={[styles.itemCategory, { color: theme.subText, fontSize: baseFontSize }]}>{item.category}</Text>
            <Text style={{ color: theme.subText, fontSize: baseFontSize }}>• Qty: {String(item.quantity).split(' ')[0]}</Text>
          </View>
        </View>

        <View style={styles.cardRight}>
          <Text style={[styles.itemDate, { color: getStatusColor(item.status), fontSize: baseFontSize - 1, fontWeight: '700' }]}>
            {item.status === 'expired' ? 'Expired' : new Date(item.expiryDate).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Personalized Greeting */}
        {userProfile && (
          <View style={[styles.greetingBanner, { backgroundColor: theme.primary + '18' }]}>
            <Ionicons name="hand-right-outline" size={18} color={theme.primary} />
            <Text style={[styles.greetingText, { color: theme.primary, fontSize: baseFontSize }]}>
              Welcome back! Your pantry is{items.length === 0 ? ' empty' : ` tracking ${items.length} item${items.length !== 1 ? 's' : ''}`}.
            </Text>
          </View>
        )}

        {/* Smart Expiry Dashboard */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: theme.card, borderLeftColor: theme.primary }]}>
            <Text style={[styles.summaryNumber, { color: theme.primary }]}>{items.length}</Text>
            <Text style={[styles.summaryLabel, { color: theme.subText, fontSize: baseFontSize - 2 }]}>Total Items</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: theme.card, borderLeftColor: '#f39c12' }]}>
            <Text style={[styles.summaryNumber, { color: '#f39c12' }]}>{expiringSoonCount}</Text>
            <Text style={[styles.summaryLabel, { color: theme.subText, fontSize: baseFontSize - 2 }]}>Expiring Soon</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: theme.card, borderLeftColor: '#e74c3c' }]}>
            <Text style={[styles.summaryNumber, { color: '#e74c3c' }]}>{expiredCount}</Text>
            <Text style={[styles.summaryLabel, { color: theme.subText, fontSize: baseFontSize - 2 }]}>Expired</Text>
          </View>
        </View>

        {/* (Alert banner removed as requested) */}

        {/* AI Recommendation Card */}
        {aiRec && (
          <View style={[styles.aiCard, { backgroundColor: theme.card, borderLeftColor: aiRec.color }]}>
            <View style={[styles.aiIconBg, { backgroundColor: aiRec.color + '22' }]}>
              <Ionicons name={aiRec.icon} size={22} color={aiRec.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.aiLabel, { color: aiRec.color, fontSize: baseFontSize - 1 }]}>
                {aiRec.isRecipe ? '👨‍🍳 Cook Recommendation' : '🤖 AI Suggestion'}
              </Text>
              <Text style={[styles.aiText, { color: theme.text, fontSize: baseFontSize + 1, fontWeight: '600' }]}>{aiRec.text}</Text>
            </View>
          </View>
        )}

        {/* Smart Recipe Suggestion */}
        {recipeSuggestion && (
          <View style={[styles.recipeCard, { backgroundColor: theme.card, borderColor: '#8e44ad44' }]}>
            <Text style={[styles.recipeEmoji]}>{recipeSuggestion.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.recipeLabel, { color: '#8e44ad', fontSize: baseFontSize - 1 }]}>🍽️ Recipe Idea</Text>
              <Text style={[styles.recipeTitle, { color: theme.text, fontSize: isOlderUser ? 16 : 14 }]}>
                Make <Text style={{ fontWeight: '700' }}>{recipeSuggestion.meal}</Text> with expiring items!
              </Text>
            </View>
          </View>
        )}

        {/* Pantry Insights */}
        <View style={[styles.insightsRow, { backgroundColor: theme.card }]}>
          <View style={styles.insightItem}>
            <Ionicons name="shield-checkmark-outline" size={22} color="#27ae60" />
            <Text style={[styles.insightNum, { color: theme.text }]}>{savedCount}</Text>
            <Text style={[styles.insightLabel, { color: theme.subText, fontSize: baseFontSize - 2 }]}>Items Saved</Text>
          </View>
          <View style={[styles.insightDivider, { backgroundColor: theme.border }]} />
          <View style={styles.insightItem}>
            <Ionicons name="close-circle-outline" size={22} color="#e74c3c" />
            <Text style={[styles.insightNum, { color: theme.text }]}>{expiredCount}</Text>
            <Text style={[styles.insightLabel, { color: theme.subText, fontSize: baseFontSize - 2 }]}>Expired</Text>
          </View>
          <View style={[styles.insightDivider, { backgroundColor: theme.border }]} />
          <View style={styles.insightItem}>
            <Ionicons name="cash-outline" size={22} color="#2ecc71" />
            <Text style={[styles.insightNum, { color: theme.text }]}>₱{estimatedSaved}</Text>
            <Text style={[styles.insightLabel, { color: theme.subText, fontSize: baseFontSize - 2 }]}>Est. Saved</Text>
          </View>
        </View>

        {/* Item List */}
        <Text style={[styles.sectionHeading, { color: theme.subText, fontSize: baseFontSize }]}>ALL PANTRY ITEMS</Text>

        {items.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <Ionicons name="basket-outline" size={80} color={theme.border} />
            <Text style={[styles.emptyTitle, { color: theme.text, fontSize: isOlderUser ? 22 : 20 }]}>No pantry items yet</Text>
            <Text style={[styles.emptySubtitle, { color: theme.subText, fontSize: baseFontSize }]}>Tap the + button to add your first item</Text>
          </View>
        ) : (
          items.map(item => (
            <View key={item.id}>{renderItem({ item })}</View>
          ))
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddGroceries')} activeOpacity={0.8}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Product Detail Modal */}
      <Modal visible={showDetail} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            {selectedItem && (
              <View>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setShowDetail(false)}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>

                <View style={styles.detailHeader}>
                  {selectedItem.imageUrl ? (
                    <Image source={{ uri: selectedItem.imageUrl }} style={styles.detailImage} resizeMode="contain" />
                  ) : (
                    <View style={[styles.detailAvatar, { backgroundColor: theme.primary + '22' }]}>
                      <Text style={[styles.detailAvatarText, { color: theme.primary }]}>{selectedItem.name.charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                  <Text style={[styles.detailName, { color: theme.text }]}>{selectedItem.name}</Text>
                  <Text style={[styles.detailCategory, { color: theme.subText }]}>{selectedItem.category}</Text>
                </View>

                <View style={[styles.detailStats, { backgroundColor: theme.background }]}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { color: theme.subText }]}>Expiry Date</Text>
                    <Text style={[styles.statValue, { color: getStatusColor(selectedItem.status) }]}>
                      {new Date(selectedItem.expiryDate).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { color: theme.subText }]}>Status</Text>
                    <Text style={[styles.statValue, { color: getStatusColor(selectedItem.status) }]}>{selectedItem.status.toUpperCase()}</Text>
                  </View>
                </View>

                <View style={styles.detailQtySection}>
                  <Text style={[styles.sectionLabel, { color: theme.text }]}>Quantity</Text>
                  <View style={styles.qtyRowLarge}>
                    <TouchableOpacity 
                      onPress={() => updateItemQuantity(selectedItem.id, selectedItem.quantity, -1)} 
                      style={[styles.qtyBtnLarge, { backgroundColor: theme.background }]}
                    >
                      <Ionicons name="remove" size={28} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.qtyValueLarge, { color: theme.text }]}>{selectedItem.quantity}</Text>
                    <TouchableOpacity 
                      onPress={() => updateItemQuantity(selectedItem.id, selectedItem.quantity, 1)} 
                      style={[styles.qtyBtnLarge, { backgroundColor: theme.primary }]}
                    >
                      <Ionicons name="add" size={28} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.detailActions}>
                  <TouchableOpacity 
                    style={[styles.mainActionBtn, { backgroundColor: theme.primary }]}
                    onPress={async () => {
                      await consumeItem(selectedItem.id);
                      setShowDetail(false);
                    }}
                  >
                    <Ionicons name="restaurant-outline" size={20} color="#fff" />
                    <Text style={styles.mainActionText}>Mark as Consumed</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.editBtn, { borderColor: theme.border }]}
                    onPress={() => {
                      setShowDetail(false);
                      navigation.navigate('ManualAdd', {
                        editMode: true, itemId: selectedItem.id, productName: selectedItem.name,
                        productCategory: selectedItem.category, productQuantity: selectedItem.quantity, productExpiry: selectedItem.expiryDate,
                      });
                    }}
                  >
                    <Ionicons name="create-outline" size={20} color={theme.text} />
                    <Text style={[styles.editText, { color: theme.text }]}>Edit Details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  greetingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 12, marginTop: 12, padding: 12, borderRadius: 10,
  },
  greetingText: { flex: 1, fontWeight: '500' },
  summaryRow: { flexDirection: 'row', paddingHorizontal: 12, paddingTop: 12, gap: 8 },
  summaryCard: {
    flex: 1, padding: 12, borderRadius: 10,
    borderLeftWidth: 3, alignItems: 'center',
  },
  summaryNumber: { fontSize: 24, fontWeight: 'bold' },
  summaryLabel: { marginTop: 4, textAlign: 'center' },
  alertBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#e74c3c', marginHorizontal: 12, marginTop: 10,
    padding: 12, borderRadius: 10, gap: 8,
  },
  alertBannerText: { color: '#fff', fontWeight: 'bold' },
  aiCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 12, marginTop: 10, padding: 14,
    borderRadius: 12, borderLeftWidth: 4,
  },
  aiIconBg: {
    width: 42, height: 42, borderRadius: 21,
    justifyContent: 'center', alignItems: 'center',
  },
  aiLabel: { fontWeight: '700', marginBottom: 3 },
  aiText: { lineHeight: 20 },
  recipeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 12, marginTop: 10, padding: 14,
    borderRadius: 12, borderWidth: 1.5,
  },
  recipeEmoji: { fontSize: 32 },
  recipeLabel: { fontWeight: '700', marginBottom: 3 },
  recipeTitle: { lineHeight: 20 },
  insightsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    marginHorizontal: 12, marginTop: 10, padding: 16, borderRadius: 12,
  },
  insightItem: { alignItems: 'center', gap: 4 },
  insightNum: { fontSize: 20, fontWeight: '800' },
  insightLabel: { textAlign: 'center' },
  insightDivider: { width: 1, height: 40 },
  sectionHeading: {
    marginHorizontal: 12, marginTop: 20, marginBottom: 8,
    fontWeight: '700', letterSpacing: 1,
  },
  emptyState: { justifyContent: 'center', alignItems: 'center', paddingVertical: 50 },
  emptyTitle: { marginTop: 15, fontWeight: 'bold' },
  emptySubtitle: { marginTop: 8 },
  card: {
    marginHorizontal: 12, borderRadius: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center',
    overflow: 'hidden', elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 3,
  },
  productThumb: { width: 60, height: 60, borderRadius: 0 },
  avatar: { width: 60, height: 60, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: 'bold' },
  cardCenter: { flex: 1, paddingVertical: 12, paddingHorizontal: 12 },
  itemName: { fontWeight: 'bold' },
  itemCategory: { marginTop: 2 },
  cardRight: { paddingHorizontal: 15, alignItems: 'center', flexDirection: 'row' },
  itemDate: { textAlign: 'right' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 25, padding: 24, elevation: 10 },
  closeBtn: { alignSelf: 'flex-end', padding: 4 },
  detailHeader: { alignItems: 'center', marginBottom: 20 },
  detailImage: { width: 120, height: 120, marginBottom: 15, borderRadius: 15, backgroundColor: '#fff' },
  detailAvatar: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  detailAvatarText: { fontSize: 40, fontWeight: 'bold' },
  detailName: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  detailCategory: { fontSize: 16, marginTop: 4 },
  
  detailStats: { flexDirection: 'row', padding: 16, borderRadius: 15, marginBottom: 20 },
  statItem: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 12, marginBottom: 4 },
  statValue: { fontSize: 15, fontWeight: '700' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  
  detailQtySection: { marginBottom: 25 },
  sectionLabel: { fontSize: 14, fontWeight: '600', marginBottom: 12, textAlign: 'center' },
  qtyRowLarge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  qtyBtnLarge: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  qtyValueLarge: { fontSize: 22, fontWeight: 'bold' },
  
  detailActions: { gap: 12 },
  mainActionBtn: { padding: 16, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  mainActionText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  editBtn: { padding: 14, borderRadius: 15, borderWidth: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  editText: { fontSize: 15, fontWeight: '600' },

  fab: {
    position: 'absolute', bottom: 25, right: 20, width: 60, height: 60,
    borderRadius: 30, backgroundColor: '#2ECC71', justifyContent: 'center',
    alignItems: 'center', elevation: 8,
    shadowColor: '#2ECC71', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },
});