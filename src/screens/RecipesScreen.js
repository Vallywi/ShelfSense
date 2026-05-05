import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { subscribeToItems } from '../services/firestore';
import { suggestRecipe, getMatchingRecipes } from '../services/ai';
import { useTheme } from '../config/ThemeContext';

const DIFFICULTY_COLOR = { Easy: '#2ecc71', Medium: '#f39c12', Hard: '#e74c3c' };

export default function RecipesScreen({ navigation }) {
  const { theme } = useTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToItems((fetchedItems) => {
      setItems(fetchedItems);
      setLoading(false);
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  const expiringItems = items.filter(i => i.status === 'soon' || i.status === 'urgent' || i.status === 'expired');
  const matchingRecipes = getMatchingRecipes(items);
  const quickSuggestion = suggestRecipe(expiringItems);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[{ color: theme.subText, fontSize: 16 }]}>Loading recipes...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: theme.primary + '22' }]}>
          <Ionicons name="restaurant" size={36} color={theme.primary} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>Smart Recipes</Text>
        <Text style={[styles.subtitle, { color: theme.subText }]}>
          Personalized suggestions based on your pantry
        </Text>
      </View>

      {/* Expiring Items Banner */}
      {expiringItems.length > 0 && (
        <View style={[styles.urgentCard, { backgroundColor: theme.card, borderColor: '#f39c1244' }]}>
          <View style={styles.urgentHeader}>
            <Ionicons name="flame" size={18} color="#e67e22" />
            <Text style={[styles.urgentTitle, { color: '#e67e22' }]}>  Use These Soon!</Text>
          </View>
          <View style={styles.chipRow}>
            {expiringItems.map(item => (
              <View key={item.id} style={[styles.chip, {
                backgroundColor: item.status === 'expired' ? '#e74c3c22' : '#f39c1222',
                borderColor: item.status === 'expired' ? '#e74c3c88' : '#f39c1288'
              }]}>
                <Text style={[styles.chipText, { color: item.status === 'expired' ? '#e74c3c' : '#e67e22' }]}>{item.name}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.aiSuggestionRow, { backgroundColor: theme.primary + '18' }]}>
            <Ionicons name="bulb-outline" size={16} color={theme.primary} />
            <Text style={[styles.aiSuggestionText, { color: theme.primary }]}>  AI: {quickSuggestion}</Text>
          </View>
        </View>
      )}

      {/* Recipe List */}
      {matchingRecipes.length > 0 ? (
        <View>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Recipes You Can Make</Text>
          <Text style={[styles.sectionSub, { color: theme.subText }]}>{matchingRecipes.length} matches found · Tap for full recipe</Text>
          {matchingRecipes.map((recipe, index) => (
            <TouchableOpacity
              key={recipe.id || index}
              style={[styles.recipeCard, { backgroundColor: theme.card }]}
              onPress={() => navigation.navigate('RecipeDetail', { recipe })}
              activeOpacity={0.85}
            >
              {/* Card Image */}
              <Image
                source={{ uri: recipe.image }}
                style={styles.recipeImage}
                resizeMode="cover"
              />

              <View style={styles.recipeContent}>
                <View style={styles.recipeTopRow}>
                  <Text style={[styles.recipeEmoji]}>{recipe.emoji}</Text>
                  {recipe.expiryBoost > 0 && (
                    <View style={styles.urgentBadge}>
                      <Text style={styles.urgentBadgeText}>🔥 Use expiring items</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.recipeName, { color: theme.text }]}>{recipe.name}</Text>
                <Text style={[styles.recipeDesc, { color: theme.subText }]} numberOfLines={2}>{recipe.description}</Text>

                <View style={styles.recipeMetaRow}>
                  <View style={styles.recipeMetaItem}>
                    <Ionicons name="time-outline" size={13} color={theme.subText} />
                    <Text style={[styles.recipeMetaText, { color: theme.subText }]}> {recipe.time}</Text>
                  </View>
                  <View style={[styles.diffBadge, { backgroundColor: (DIFFICULTY_COLOR[recipe.difficulty] || '#27ae60') + '22' }]}>
                    <Text style={[styles.diffText, { color: DIFFICULTY_COLOR[recipe.difficulty] || '#27ae60' }]}>
                      {recipe.difficulty}
                    </Text>
                  </View>
                  <View style={styles.recipeMetaItem}>
                    <Ionicons name="checkmark-circle" size={13} color={theme.primary} />
                    <Text style={[styles.recipeMetaText, { color: theme.primary }]}> {recipe.matchCount} ingredient{recipe.matchCount !== 1 ? 's' : ''} ready</Text>
                  </View>
                </View>

                <View style={styles.tapHint}>
                  <Text style={[styles.tapHintText, { color: theme.primary }]}>View full recipe →</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="basket-outline" size={70} color={theme.border} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Your pantry is empty</Text>
          <Text style={[styles.emptySubtitle, { color: theme.subText }]}>Add pantry items to unlock smart recipe suggestions</Text>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 50 }}>🍳</Text>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No matches yet</Text>
          <Text style={[styles.emptySubtitle, { color: theme.subText }]}>Try adding eggs, bread, milk, chicken, or rice to get started</Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingTop: 24, paddingBottom: 20, paddingHorizontal: 20 },
  headerIcon: {
    width: 72, height: 72, borderRadius: 36,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: 0.3 },
  subtitle: { fontSize: 14, marginTop: 6, textAlign: 'center' },
  urgentCard: {
    marginHorizontal: 16, marginBottom: 20, padding: 16,
    borderRadius: 16, borderWidth: 1.5,
  },
  urgentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  urgentTitle: { fontSize: 16, fontWeight: '700' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  chipText: { fontSize: 13, fontWeight: '600' },
  aiSuggestionRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 10, borderRadius: 10,
  },
  aiSuggestionText: { fontSize: 14, fontStyle: 'italic', fontWeight: '500' },
  sectionTitle: { fontSize: 20, fontWeight: '800', marginHorizontal: 16, marginBottom: 4 },
  sectionSub: { fontSize: 13, marginHorizontal: 16, marginBottom: 16 },
  recipeCard: {
    marginHorizontal: 16, marginBottom: 16,
    borderRadius: 18, overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  recipeImage: { width: '100%', height: 160 },
  recipeContent: { padding: 16 },
  recipeTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  recipeEmoji: { fontSize: 28 },
  urgentBadge: { backgroundColor: '#e67e2222', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  urgentBadgeText: { fontSize: 12, color: '#e67e22', fontWeight: '600' },
  recipeName: { fontSize: 20, fontWeight: '800', marginBottom: 6, letterSpacing: 0.2 },
  recipeDesc: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  recipeMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap' },
  recipeMetaItem: { flexDirection: 'row', alignItems: 'center' },
  recipeMetaText: { fontSize: 12 },
  diffBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  diffText: { fontSize: 12, fontWeight: '700' },
  tapHint: { marginTop: 12, alignItems: 'flex-end' },
  tapHintText: { fontSize: 13, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginTop: 16 },
  emptySubtitle: { fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 22 },
});
