import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Image, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { subscribeToItems, deleteItem, updateItemQuantity, consumeItem } from '../services/firestore';
import { getRecommendation, suggestRecipe } from '../services/ai';
import { useTheme } from '../config/ThemeContext';
import { useTutorial } from '../config/TutorialContext';
import { checkAndNotify } from '../services/notifications';
import { PantryItemSkeleton, SummaryCardSkeleton } from '../components/Skeleton';
import TourTarget from '../components/TourTarget';

const getGradeColor = (grade) => {
  switch ((grade || '').toLowerCase()) {
    case 'a': return '#3B9C5C';
    case 'b': return '#7FC8A9';
    case 'c': return '#E8B870';
    case 'd': return '#E89274';
    case 'e': return '#E07A6E';
    default: return '#9DB3A8';
  }
};

const getStatusColor = (status, theme) => {
  switch (status) {
    case 'safe': return theme.safe;
    case 'soon': return theme.warning;
    case 'urgent': return '#E89274';
    case 'expired': return theme.danger;
    default: return theme.safe;
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

function getAIRecommendation(items, theme) {
  const urgent = items.find(i => i.status === 'urgent' || i.status === 'expired');
  const soon = items.find(i => i.status === 'soon');

  if (items.length > 0) {
    const recipe = suggestRecipe(items);
    return {
      text: recipe,
      icon: 'restaurant-outline',
      color: urgent ? theme.danger : (soon ? theme.warning : theme.primaryDeep),
      isRecipe: true,
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
  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | safe | soon | urgent | expired
  const [sortBy, setSortBy] = useState('expiry'); // expiry | name | recent
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const isOlderUser = userProfile && parseInt(userProfile.age) >= 50;
  const baseFontSize = isOlderUser ? 15 : 13;
  const itemNameSize = isOlderUser ? 19 : 17;

  useEffect(() => {
    const unsubscribe = subscribeToItems((fetchedItems) => {
      setItems(fetchedItems);
      setLoading(false);
      // Fire browser notifications for newly-urgent / expired items
      checkAndNotify(fetchedItems).catch(err => console.warn('Notification check failed:', err));
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  const expiringSoonCount = items.filter(i => i.status === 'soon' || i.status === 'urgent').length;
  const expiredCount = items.filter(i => i.status === 'expired').length;
  const savedCount = items.filter(i => i.status === 'safe').length;
  const estimatedSaved = (savedCount * 150).toLocaleString();

  const aiRec = getAIRecommendation(items, theme);
  const recipeSuggestion = getRecipeSuggestion(items.filter(i => i.status !== 'expired'));

  // Available categories for filter dropdown
  const availableCategories = useMemo(() => {
    const set = new Set(items.map(i => i.category).filter(Boolean));
    return ['all', ...Array.from(set).sort()];
  }, [items]);

  // Apply search + filters + sort
  const filteredItems = useMemo(() => {
    let result = items;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(i =>
        (i.name || '').toLowerCase().includes(q) ||
        (i.category || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter(i => i.status === statusFilter);
    }
    if (categoryFilter !== 'all') {
      result = result.filter(i => i.category === categoryFilter);
    }
    result = [...result];
    if (sortBy === 'name') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'recent') {
      result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else {
      result.sort((a, b) => new Date(a.expiryDate || 0) - new Date(b.expiryDate || 0));
    }
    return result;
  }, [items, searchQuery, statusFilter, categoryFilter, sortBy]);

  const filtersActive = searchQuery.trim() || statusFilter !== 'all' || categoryFilter !== 'all' || sortBy !== 'expiry';
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setSortBy('expiry');
  };

  const formatExpiry = (item) => {
    if (item.status === 'expired') return 'Expired';
    if (!item.expiryDate) return '—';
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const exp = new Date(item.expiryDate); exp.setHours(0, 0, 0, 0);
    const diff = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff > 1 && diff <= 7) return `${diff} days`;
    return new Date(item.expiryDate).toLocaleDateString();
  };

  const renderItem = (item) => {
    const initial = (item.name || '?').charAt(0).toUpperCase();
    const statusColor = getStatusColor(item.status, theme);
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, shadowOpacity: theme.shadowOpacity }]}
        onPress={() => { setSelectedItem(item); setShowDetail(true); }}
        activeOpacity={0.85}
      >
        <View style={[styles.statusBar, { backgroundColor: statusColor }]} />

        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.productThumb} resizeMode="cover" />
        ) : (
          <View style={[styles.avatar, { backgroundColor: theme.primarySoft }]}>
            <Text style={[styles.avatarText, { color: theme.primaryDeep }]}>{initial}</Text>
          </View>
        )}

        <View style={styles.cardCenter}>
          <Text style={[styles.itemName, { color: theme.text, fontSize: itemNameSize }]} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.itemMeta}>
            <Text style={[styles.itemCategory, { color: theme.subText, fontSize: baseFontSize }]} numberOfLines={1}>
              {item.category}
            </Text>
            <Text style={{ color: theme.subText, fontSize: baseFontSize }}>·</Text>
            <Text style={{ color: theme.subText, fontSize: baseFontSize }}>
              Qty {String(item.quantity).split(' ')[0]}
            </Text>
          </View>
        </View>

        <View style={[styles.expiryPill, { backgroundColor: statusColor + '22' }]}>
          <Text style={[styles.expiryText, { color: statusColor, fontSize: baseFontSize - 1 }]}>
            {formatExpiry(item)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }}>

        {/* Greeting */}
        {userProfile && (
          <View style={[styles.greetingBanner, { backgroundColor: theme.primarySoft, borderColor: theme.primary + '55' }]}>
            <View style={[styles.greetingIcon, { backgroundColor: theme.primary }]}>
              <Ionicons name="leaf" size={16} color="#FFFFFF" />
            </View>
            <Text style={[styles.greetingText, { color: theme.primaryDeep, fontSize: baseFontSize }]}>
              {items.length === 0
                ? 'Welcome back! Your pantry is empty.'
                : `Welcome back! Tracking ${items.length} item${items.length !== 1 ? 's' : ''}.`}
            </Text>
          </View>
        )}

        {/* Summary Cards */}
        <TourTarget id="home-summary" style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border, shadowOpacity: theme.shadowOpacity }]}>
            <View style={[styles.summaryIcon, { backgroundColor: theme.primarySoft }]}>
              <Ionicons name="basket" size={18} color={theme.primaryDeep} />
            </View>
            <Text style={[styles.summaryNumber, { color: theme.text }]}>{items.length}</Text>
            <Text style={[styles.summaryLabel, { color: theme.subText }]}>Total</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border, shadowOpacity: theme.shadowOpacity }]}>
            <View style={[styles.summaryIcon, { backgroundColor: theme.warningSoft }]}>
              <Ionicons name="time" size={18} color={theme.warning} />
            </View>
            <Text style={[styles.summaryNumber, { color: theme.text }]}>{expiringSoonCount}</Text>
            <Text style={[styles.summaryLabel, { color: theme.subText }]}>Expiring</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border, shadowOpacity: theme.shadowOpacity }]}>
            <View style={[styles.summaryIcon, { backgroundColor: theme.dangerSoft }]}>
              <Ionicons name="alert-circle" size={18} color={theme.danger} />
            </View>
            <Text style={[styles.summaryNumber, { color: theme.text }]}>{expiredCount}</Text>
            <Text style={[styles.summaryLabel, { color: theme.subText }]}>Expired</Text>
          </View>
        </TourTarget>

        {/* AI Recommendation */}
        {aiRec && (
          <View style={[styles.aiCard, { backgroundColor: theme.card, borderColor: theme.border, shadowOpacity: theme.shadowOpacity }]}>
            <View style={[styles.aiIconBg, { backgroundColor: theme.primarySoft }]}>
              <Ionicons name={aiRec.icon} size={22} color={theme.primaryDeep} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.aiLabel, { color: theme.primaryDeep }]}>
                {aiRec.isRecipe ? 'Cook Suggestion' : 'AI Tip'}
              </Text>
              <Text style={[styles.aiText, { color: theme.text, fontSize: baseFontSize + 1 }]}>{aiRec.text}</Text>
            </View>
          </View>
        )}

        {/* Recipe idea */}
        {recipeSuggestion && (
          <View style={[styles.recipeCard, { backgroundColor: theme.accentSoft, borderColor: theme.accent }]}>
            <Text style={styles.recipeEmoji}>{recipeSuggestion.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.recipeLabel, { color: theme.accentDeep }]}>Recipe Idea</Text>
              <Text style={[styles.recipeTitle, { color: theme.text, fontSize: isOlderUser ? 16 : 14 }]}>
                Try <Text style={{ fontWeight: '800' }}>{recipeSuggestion.meal}</Text> with what's expiring
              </Text>
            </View>
          </View>
        )}

        {/* Insights */}
        <View style={[styles.insightsRow, { backgroundColor: theme.card, borderColor: theme.border, shadowOpacity: theme.shadowOpacity }]}>
          <View style={styles.insightItem}>
            <View style={[styles.insightIcon, { backgroundColor: theme.safeSoft }]}>
              <Ionicons name="shield-checkmark" size={18} color={theme.safe} />
            </View>
            <Text style={[styles.insightNum, { color: theme.text }]}>{savedCount}</Text>
            <Text style={[styles.insightLabel, { color: theme.subText, fontSize: baseFontSize - 2 }]}>Saved</Text>
          </View>
          <View style={[styles.insightDivider, { backgroundColor: theme.divider }]} />
          <View style={styles.insightItem}>
            <View style={[styles.insightIcon, { backgroundColor: theme.dangerSoft }]}>
              <Ionicons name="close-circle" size={18} color={theme.danger} />
            </View>
            <Text style={[styles.insightNum, { color: theme.text }]}>{expiredCount}</Text>
            <Text style={[styles.insightLabel, { color: theme.subText, fontSize: baseFontSize - 2 }]}>Expired</Text>
          </View>
          <View style={[styles.insightDivider, { backgroundColor: theme.divider }]} />
          <View style={styles.insightItem}>
            <View style={[styles.insightIcon, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="cash" size={18} color={theme.accentDeep} />
            </View>
            <Text style={[styles.insightNum, { color: theme.text }]}>₱{estimatedSaved}</Text>
            <Text style={[styles.insightLabel, { color: theme.subText, fontSize: baseFontSize - 2 }]}>Est. Saved</Text>
          </View>
        </View>

        {/* List header */}
        <View style={styles.listHeaderRow}>
          <Text style={[styles.sectionHeading, { color: theme.subText, fontSize: baseFontSize, marginTop: 0, marginBottom: 0 }]}>
            YOUR PANTRY {filteredItems.length !== items.length ? `(${filteredItems.length}/${items.length})` : items.length > 0 ? `(${items.length})` : ''}
          </Text>
          {items.length > 0 && (
            <TourTarget id="home-filter">
              <TouchableOpacity
                onPress={() => setShowFilters(s => !s)}
                style={[
                  styles.filterToggle,
                  { backgroundColor: filtersActive ? theme.primarySoft : theme.surface, borderColor: filtersActive ? theme.primary : theme.border },
                ]}
                activeOpacity={0.8}
              >
                <Ionicons name="options-outline" size={14} color={filtersActive ? theme.primaryDeep : theme.subText} />
                <Text style={[styles.filterToggleText, { color: filtersActive ? theme.primaryDeep : theme.subText }]}>
                  {showFilters ? 'Hide' : 'Filter'}
                </Text>
              </TouchableOpacity>
            </TourTarget>
          )}
        </View>

        {/* Search + filter panel */}
        {items.length > 0 && (
          <View style={styles.searchWrap}>
            <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="search" size={16} color={theme.subText} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search by name or category..."
                placeholderTextColor={theme.subText}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                  <Ionicons name="close-circle" size={16} color={theme.subText} />
                </TouchableOpacity>
              ) : null}
            </View>

            {showFilters && (
              <View style={styles.filterPanel}>
                {/* Status pills */}
                <Text style={[styles.filterLabel, { color: theme.subText }]}>STATUS</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
                  {[
                    { value: 'all', label: 'All', color: theme.primaryDeep },
                    { value: 'safe', label: 'Safe', color: theme.safe },
                    { value: 'soon', label: 'Soon', color: theme.warning },
                    { value: 'urgent', label: 'Urgent', color: '#E89274' },
                    { value: 'expired', label: 'Expired', color: theme.danger },
                  ].map(s => {
                    const active = statusFilter === s.value;
                    return (
                      <TouchableOpacity
                        key={s.value}
                        onPress={() => setStatusFilter(s.value)}
                        style={[
                          styles.pill,
                          {
                            backgroundColor: active ? s.color + '22' : theme.surface,
                            borderColor: active ? s.color : theme.border,
                          },
                        ]}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.pillText, { color: active ? s.color : theme.text }]}>
                          {s.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Category */}
                {availableCategories.length > 2 && (
                  <>
                    <Text style={[styles.filterLabel, { color: theme.subText, marginTop: 10 }]}>CATEGORY</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
                      {availableCategories.map(cat => {
                        const active = categoryFilter === cat;
                        return (
                          <TouchableOpacity
                            key={cat}
                            onPress={() => setCategoryFilter(cat)}
                            style={[
                              styles.pill,
                              {
                                backgroundColor: active ? theme.primarySoft : theme.surface,
                                borderColor: active ? theme.primary : theme.border,
                              },
                            ]}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.pillText, { color: active ? theme.primaryDeep : theme.text }]}>
                              {cat === 'all' ? 'All' : cat}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </>
                )}

                {/* Sort */}
                <Text style={[styles.filterLabel, { color: theme.subText, marginTop: 10 }]}>SORT BY</Text>
                <View style={styles.sortRow}>
                  {[
                    { value: 'expiry', label: 'Expiry date', icon: 'time-outline' },
                    { value: 'name', label: 'Name (A–Z)', icon: 'text-outline' },
                    { value: 'recent', label: 'Recently added', icon: 'add-circle-outline' },
                  ].map(s => {
                    const active = sortBy === s.value;
                    return (
                      <TouchableOpacity
                        key={s.value}
                        onPress={() => setSortBy(s.value)}
                        style={[
                          styles.sortPill,
                          {
                            backgroundColor: active ? theme.primarySoft : theme.surface,
                            borderColor: active ? theme.primary : theme.border,
                          },
                        ]}
                        activeOpacity={0.8}
                      >
                        <Ionicons name={s.icon} size={13} color={active ? theme.primaryDeep : theme.subText} />
                        <Text style={[styles.pillText, { color: active ? theme.primaryDeep : theme.text }]}>
                          {s.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {filtersActive && (
                  <TouchableOpacity
                    onPress={clearFilters}
                    style={[styles.clearBtn, { borderColor: theme.border }]}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={14} color={theme.subText} />
                    <Text style={[styles.clearBtnText, { color: theme.subText }]}>Clear filters</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}

        {loading ? (
          <View>
            <PantryItemSkeleton />
            <PantryItemSkeleton />
            <PantryItemSkeleton />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconBg, { backgroundColor: theme.primarySoft }]}>
              <Ionicons name="basket-outline" size={56} color={theme.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text, fontSize: isOlderUser ? 22 : 20 }]}>No pantry items yet</Text>
            <Text style={[styles.emptySubtitle, { color: theme.subText, fontSize: baseFontSize }]}>
              Tap below to add your first item
            </Text>
            <TouchableOpacity
              style={[styles.emptyCtaBtn, { backgroundColor: theme.primaryDeep, shadowColor: theme.primaryDeep }]}
              onPress={() => navigation.navigate('AddGroceries')}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.emptyCtaText}>Add Your First Item</Text>
            </TouchableOpacity>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconBg, { backgroundColor: theme.surface }]}>
              <Ionicons name="search" size={48} color={theme.subText} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text, fontSize: isOlderUser ? 20 : 18 }]}>No matches</Text>
            <Text style={[styles.emptySubtitle, { color: theme.subText, fontSize: baseFontSize }]}>
              Try a different search or clear your filters
            </Text>
            <TouchableOpacity
              onPress={clearFilters}
              style={[styles.clearBtn, { borderColor: theme.primary, marginTop: 14 }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.clearBtnText, { color: theme.primaryDeep }]}>Clear filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredItems.map(renderItem)
        )}
      </ScrollView>

      {/* FAB */}
      <TourTarget id="home-fab" style={styles.fabWrap}>
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.primaryDeep, shadowColor: theme.primaryDeep }]}
          onPress={() => navigation.navigate('AddGroceries')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </TourTarget>

      {/* Detail Sheet (bottom-up) */}
      <Modal visible={showDetail} transparent animationType="slide" onRequestClose={() => setShowDetail(false)}>
        <TouchableOpacity
          style={[styles.sheetOverlay, { backgroundColor: theme.modalOverlay }]}
          activeOpacity={1}
          onPress={() => setShowDetail(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={[styles.sheetContent, { backgroundColor: theme.card }]}>
            <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
            {selectedItem && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '90%' }}>
                <TouchableOpacity
                  style={[styles.closeBtn, { backgroundColor: theme.surface }]}
                  onPress={() => setShowDetail(false)}
                >
                  <Ionicons name="close" size={20} color={theme.text} />
                </TouchableOpacity>

                <View style={styles.detailHeader}>
                  {selectedItem.imageUrl ? (
                    <View style={[styles.detailImageWrap, { backgroundColor: theme.surface }]}>
                      <Image source={{ uri: selectedItem.imageUrl }} style={styles.detailImage} resizeMode="contain" />
                    </View>
                  ) : (
                    <View style={[styles.detailAvatar, { backgroundColor: theme.primarySoft }]}>
                      <Text style={[styles.detailAvatarText, { color: theme.primaryDeep }]}>
                        {selectedItem.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <Text style={[styles.detailName, { color: theme.text }]}>{selectedItem.name}</Text>
                  <Text style={[styles.detailCategory, { color: theme.subText }]}>{selectedItem.category}</Text>
                </View>

                <View style={[styles.detailStats, { backgroundColor: theme.surface }]}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { color: theme.subText }]}>Expiry</Text>
                    <Text style={[styles.statValue, { color: getStatusColor(selectedItem.status, theme) }]}>
                      {selectedItem.expiryDate ? new Date(selectedItem.expiryDate).toLocaleDateString() : '—'}
                    </Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: theme.divider }]} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { color: theme.subText }]}>Status</Text>
                    <Text style={[styles.statValue, { color: getStatusColor(selectedItem.status, theme) }]}>
                      {(selectedItem.status || '').toUpperCase()}
                    </Text>
                  </View>
                </View>

                {selectedItem.nutrition && (
                  <View style={[styles.nutritionBlock, { backgroundColor: theme.accentSoft, borderColor: theme.accent + '55' }]}>
                    <View style={styles.nutritionHeader}>
                      <Ionicons name="nutrition-outline" size={16} color={theme.accentDeep} />
                      <Text style={[styles.nutritionTitle, { color: theme.accentDeep }]}>NUTRITION (per 100g)</Text>
                      {selectedItem.nutrition.nutritionGrade && (
                        <View style={[styles.gradeBadge, { backgroundColor: getGradeColor(selectedItem.nutrition.nutritionGrade) }]}>
                          <Text style={styles.gradeBadgeText}>{selectedItem.nutrition.nutritionGrade.toUpperCase()}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.nutritionGrid}>
                      {selectedItem.nutrition.calories != null && (
                        <View style={styles.nutritionCell}>
                          <Text style={[styles.nutritionVal, { color: theme.text }]}>{selectedItem.nutrition.calories}</Text>
                          <Text style={[styles.nutritionLbl, { color: theme.subText }]}>kcal</Text>
                        </View>
                      )}
                      {selectedItem.nutrition.protein != null && (
                        <View style={styles.nutritionCell}>
                          <Text style={[styles.nutritionVal, { color: theme.text }]}>{selectedItem.nutrition.protein}g</Text>
                          <Text style={[styles.nutritionLbl, { color: theme.subText }]}>Protein</Text>
                        </View>
                      )}
                      {selectedItem.nutrition.carbs != null && (
                        <View style={styles.nutritionCell}>
                          <Text style={[styles.nutritionVal, { color: theme.text }]}>{selectedItem.nutrition.carbs}g</Text>
                          <Text style={[styles.nutritionLbl, { color: theme.subText }]}>Carbs</Text>
                        </View>
                      )}
                      {selectedItem.nutrition.fat != null && (
                        <View style={styles.nutritionCell}>
                          <Text style={[styles.nutritionVal, { color: theme.text }]}>{selectedItem.nutrition.fat}g</Text>
                          <Text style={[styles.nutritionLbl, { color: theme.subText }]}>Fat</Text>
                        </View>
                      )}
                      {selectedItem.nutrition.sugar != null && (
                        <View style={styles.nutritionCell}>
                          <Text style={[styles.nutritionVal, { color: theme.text }]}>{selectedItem.nutrition.sugar}g</Text>
                          <Text style={[styles.nutritionLbl, { color: theme.subText }]}>Sugar</Text>
                        </View>
                      )}
                      {selectedItem.nutrition.fiber != null && (
                        <View style={styles.nutritionCell}>
                          <Text style={[styles.nutritionVal, { color: theme.text }]}>{selectedItem.nutrition.fiber}g</Text>
                          <Text style={[styles.nutritionLbl, { color: theme.subText }]}>Fiber</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                <View style={styles.detailQtySection}>
                  <Text style={[styles.qtyLabel, { color: theme.subText }]}>QUANTITY</Text>
                  <View style={styles.qtyRowLarge}>
                    <TouchableOpacity
                      onPress={() => updateItemQuantity(selectedItem.id, selectedItem.quantity, -1)}
                      style={[styles.qtyBtnLarge, { backgroundColor: theme.surface, borderColor: theme.border }]}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="remove" size={26} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.qtyValueLarge, { color: theme.text }]}>{selectedItem.quantity}</Text>
                    <TouchableOpacity
                      onPress={() => updateItemQuantity(selectedItem.id, selectedItem.quantity, 1)}
                      style={[styles.qtyBtnLarge, { backgroundColor: theme.primaryDeep, borderColor: theme.primaryDeep }]}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="add" size={26} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.detailActions}>
                  <TouchableOpacity
                    style={[styles.mainActionBtn, { backgroundColor: theme.primaryDeep }]}
                    onPress={async () => {
                      await consumeItem(selectedItem.id);
                      setShowDetail(false);
                    }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="restaurant-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.mainActionText}>Mark as Consumed</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.editBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
                    onPress={() => {
                      setShowDetail(false);
                      navigation.navigate('ManualAdd', {
                        editMode: true, itemId: selectedItem.id, productName: selectedItem.name,
                        productCategory: selectedItem.category, productQuantity: selectedItem.quantity, productExpiry: selectedItem.expiryDate,
                      });
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="create-outline" size={20} color={theme.text} />
                    <Text style={[styles.editText, { color: theme.text }]}>Edit Details</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ height: 12 }} />
              </ScrollView>
            )}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  greetingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 14, marginTop: 14, padding: 12, borderRadius: 14,
    borderWidth: 1,
  },
  greetingIcon: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  greetingText: { flex: 1, fontWeight: '600' },

  summaryRow: { flexDirection: 'row', paddingHorizontal: 14, paddingTop: 14, gap: 10 },
  summaryCard: {
    flex: 1, padding: 14, borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  summaryIcon: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 8,
  },
  summaryNumber: { fontSize: 22, fontWeight: '800' },
  summaryLabel: { fontSize: 11, fontWeight: '600', marginTop: 2, letterSpacing: 0.5 },

  aiCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 14, marginTop: 14, padding: 14,
    borderRadius: 16, borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  aiIconBg: {
    width: 42, height: 42, borderRadius: 21,
    justifyContent: 'center', alignItems: 'center',
  },
  aiLabel: { fontWeight: '700', marginBottom: 3, fontSize: 12, letterSpacing: 0.5 },
  aiText: { lineHeight: 20, fontWeight: '500' },

  recipeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 14, marginTop: 12, padding: 14,
    borderRadius: 16, borderWidth: 1,
  },
  recipeEmoji: { fontSize: 32 },
  recipeLabel: { fontWeight: '700', marginBottom: 3, fontSize: 12, letterSpacing: 0.5 },
  recipeTitle: { lineHeight: 20, fontWeight: '500' },

  insightsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    marginHorizontal: 14, marginTop: 12, padding: 14, borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  insightItem: { alignItems: 'center', gap: 4, flex: 1 },
  insightIcon: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 4,
  },
  insightNum: { fontSize: 18, fontWeight: '800' },
  insightLabel: { textAlign: 'center', fontWeight: '600', letterSpacing: 0.3 },
  insightDivider: { width: 1, height: 50, alignSelf: 'center' },

  sectionHeading: {
    marginHorizontal: 14, marginTop: 22, marginBottom: 10,
    fontWeight: '700', letterSpacing: 1.2,
  },

  listHeaderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 14, marginTop: 22, marginBottom: 10,
  },
  filterToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 10, borderWidth: 1,
  },
  filterToggleText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  searchWrap: { marginHorizontal: 14, marginBottom: 10 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, height: 42,
    borderRadius: 12, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '500' },
  filterPanel: { marginTop: 10 },
  filterLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 6 },
  pillRow: { flexGrow: 0 },
  pill: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 10, borderWidth: 1,
    marginRight: 6, marginBottom: 4,
  },
  pillText: { fontSize: 12, fontWeight: '700' },
  sortRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  sortPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 10, borderWidth: 1,
  },
  clearBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 10, borderWidth: 1,
    marginTop: 10,
  },
  clearBtnText: { fontSize: 12, fontWeight: '600' },

  emptyState: { justifyContent: 'center', alignItems: 'center', paddingVertical: 40, paddingHorizontal: 30 },
  emptyIconBg: {
    width: 110, height: 110, borderRadius: 55,
    justifyContent: 'center', alignItems: 'center', marginBottom: 18,
  },
  emptyTitle: { fontWeight: '800' },
  emptySubtitle: { marginTop: 8, textAlign: 'center', lineHeight: 20 },
  emptyCtaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 18, paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 14,
    elevation: 4, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8,
  },
  emptyCtaText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14, letterSpacing: 0.3 },

  card: {
    marginHorizontal: 14, borderRadius: 16, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  statusBar: { width: 4, alignSelf: 'stretch' },
  productThumb: { width: 56, height: 56, borderRadius: 12, marginLeft: 10 },
  avatar: {
    width: 50, height: 50, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    marginLeft: 12,
  },
  avatarText: { fontSize: 18, fontWeight: '800' },
  cardCenter: { flex: 1, paddingVertical: 12, paddingHorizontal: 14 },
  itemName: { fontWeight: '700' },
  itemMeta: { flexDirection: 'row', gap: 6, marginTop: 3, alignItems: 'center' },
  itemCategory: { fontWeight: '500' },
  expiryPill: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 12, marginRight: 12,
  },
  expiryText: { fontWeight: '700' },

  fabWrap: {
    position: 'absolute', bottom: 25, right: 20,
  },
  fab: {
    width: 60, height: 60,
    borderRadius: 30, justifyContent: 'center', alignItems: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8,
  },

  sheetOverlay: { flex: 1, justifyContent: 'flex-end' },
  sheetContent: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 22, paddingTop: 8, paddingBottom: 28,
    elevation: 10, maxHeight: '85%',
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 14, marginTop: 4,
  },
  closeBtn: {
    alignSelf: 'flex-end', width: 34, height: 34, borderRadius: 17,
    justifyContent: 'center', alignItems: 'center',
  },
  detailHeader: { alignItems: 'center', marginBottom: 18 },
  detailImageWrap: {
    width: 130, height: 130, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14, padding: 8,
  },
  detailImage: { width: '100%', height: '100%' },
  detailAvatar: {
    width: 100, height: 100, borderRadius: 50,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
  },
  detailAvatarText: { fontSize: 38, fontWeight: '800' },
  detailName: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  detailCategory: { fontSize: 14, marginTop: 4, fontWeight: '500' },

  detailStats: { flexDirection: 'row', padding: 16, borderRadius: 14, marginBottom: 18 },
  statItem: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 11, marginBottom: 4, fontWeight: '600', letterSpacing: 0.8 },
  statValue: { fontSize: 14, fontWeight: '700' },
  statDivider: { width: 1 },

  nutritionBlock: {
    padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 18,
  },
  nutritionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10,
  },
  nutritionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1, flex: 1 },
  gradeBadge: {
    width: 24, height: 24, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  gradeBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  nutritionGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },
  nutritionCell: {
    flexBasis: '31%', flexGrow: 1,
    alignItems: 'center', paddingVertical: 6,
  },
  nutritionVal: { fontSize: 15, fontWeight: '800' },
  nutritionLbl: { fontSize: 10, fontWeight: '600', marginTop: 1, letterSpacing: 0.3 },

  detailQtySection: { marginBottom: 22 },
  qtyLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textAlign: 'center', marginBottom: 12 },
  qtyRowLarge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 22 },
  qtyBtnLarge: {
    width: 50, height: 50, borderRadius: 25, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
  },
  qtyValueLarge: { fontSize: 22, fontWeight: '800', minWidth: 40, textAlign: 'center' },

  detailActions: { gap: 10 },
  mainActionBtn: { padding: 16, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  mainActionText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
  editBtn: { padding: 14, borderRadius: 14, borderWidth: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  editText: { fontSize: 14, fontWeight: '600' },
});
