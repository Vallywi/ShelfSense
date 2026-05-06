import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { subscribeToItems } from '../services/firestore';
import { suggestRecipe, getMatchingRecipes } from '../services/ai';
import { useTheme } from '../config/ThemeContext';

const getDifficultyColor = (level, theme) => {
  switch (level) {
    case 'Easy': return theme.safe;
    case 'Medium': return theme.warning;
    case 'Hard': return theme.danger;
    default: return theme.safe;
  }
};

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

  const matchingRecipes = getMatchingRecipes(items);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.subText, fontSize: 15, fontWeight: '500' }}>Loading recipes...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingBottom: 60 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: theme.primarySoft }]}>
          <Ionicons name="restaurant" size={32} color={theme.primaryDeep} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>Smart Recipes</Text>
        <Text style={[styles.subtitle, { color: theme.subText }]}>
          Personalized suggestions based on your pantry
        </Text>
      </View>

      {/* Recipe List */}
      {matchingRecipes.length > 0 ? (
        <View>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Recipes You Can Make</Text>
            <View style={[styles.matchPill, { backgroundColor: theme.primarySoft }]}>
              <Text style={[styles.matchPillText, { color: theme.primaryDeep }]}>
                {matchingRecipes.length} match{matchingRecipes.length !== 1 ? 'es' : ''}
              </Text>
            </View>
          </View>
          <Text style={[styles.sectionSub, { color: theme.subText }]}>Tap a card for the full recipe</Text>

          {matchingRecipes.map((recipe, index) => {
            const diffColor = getDifficultyColor(recipe.difficulty, theme);
            return (
              <TouchableOpacity
                key={recipe.id || index}
                style={[styles.recipeCard, { backgroundColor: theme.card, borderColor: theme.border, shadowOpacity: theme.shadowOpacity }]}
                onPress={() => navigation.navigate('RecipeDetail', { recipe })}
                activeOpacity={0.9}
              >
                <View style={styles.imageWrap}>
                  <Image
                    source={{ uri: recipe.image }}
                    style={styles.recipeImage}
                    resizeMode="cover"
                  />
                  {recipe.expiryBoost > 0 && (
                    <View style={[styles.urgentBadge, { backgroundColor: theme.warning }]}>
                      <Ionicons name="flame" size={11} color="#FFFFFF" />
                      <Text style={styles.urgentBadgeText}>Use expiring</Text>
                    </View>
                  )}
                </View>

                <View style={styles.recipeContent}>
                  <View style={styles.recipeTopRow}>
                    <Text style={styles.recipeEmoji}>{recipe.emoji}</Text>
                    <View style={[styles.diffBadge, { backgroundColor: diffColor + '22' }]}>
                      <Text style={[styles.diffText, { color: diffColor }]}>
                        {recipe.difficulty}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.recipeName, { color: theme.text }]} numberOfLines={1}>{recipe.name}</Text>
                  <Text style={[styles.recipeDesc, { color: theme.subText }]} numberOfLines={2}>{recipe.description}</Text>

                  <View style={[styles.recipeMetaRow, { borderTopColor: theme.divider }]}>
                    <View style={styles.recipeMetaItem}>
                      <Ionicons name="time-outline" size={14} color={theme.subText} />
                      <Text style={[styles.recipeMetaText, { color: theme.subText }]}>{recipe.time}</Text>
                    </View>
                    <View style={styles.recipeMetaItem}>
                      <Ionicons name="checkmark-circle" size={14} color={theme.primaryDeep} />
                      <Text style={[styles.recipeMetaText, { color: theme.primaryDeep, fontWeight: '700' }]}>
                        {recipe.matchCount} ready
                      </Text>
                    </View>
                    <View style={styles.viewArrow}>
                      <Text style={[styles.viewText, { color: theme.primaryDeep }]}>View</Text>
                      <Ionicons name="arrow-forward" size={13} color={theme.primaryDeep} />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIconBg, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="basket-outline" size={56} color={theme.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Your pantry is empty</Text>
          <Text style={[styles.emptySubtitle, { color: theme.subText }]}>
            Add pantry items to unlock smart recipe suggestions
          </Text>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIconBg, { backgroundColor: theme.accentSoft }]}>
            <Text style={{ fontSize: 48 }}>🍳</Text>
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No matches yet</Text>
          <Text style={[styles.emptySubtitle, { color: theme.subText }]}>
            Try adding eggs, bread, milk, chicken, or rice
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingTop: 24, paddingBottom: 20, paddingHorizontal: 20 },
  headerIcon: {
    width: 64, height: 64, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: 0.3 },
  subtitle: { fontSize: 13, marginTop: 6, textAlign: 'center', fontWeight: '500' },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 16, marginBottom: 4,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  matchPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  matchPillText: { fontSize: 11, fontWeight: '700' },
  sectionSub: { fontSize: 12, marginHorizontal: 16, marginBottom: 14, fontWeight: '500' },

  recipeCard: {
    marginHorizontal: 16, marginBottom: 14,
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 }, shadowRadius: 8, elevation: 2,
  },
  imageWrap: { position: 'relative' },
  recipeImage: { width: '100%', height: 150 },
  urgentBadge: {
    position: 'absolute', top: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
  },
  urgentBadgeText: { fontSize: 11, color: '#FFFFFF', fontWeight: '700' },

  recipeContent: { padding: 16 },
  recipeTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  recipeEmoji: { fontSize: 26 },
  diffBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  diffText: { fontSize: 11, fontWeight: '700' },

  recipeName: { fontSize: 18, fontWeight: '800', marginBottom: 6, letterSpacing: 0.2 },
  recipeDesc: { fontSize: 13, lineHeight: 19, marginBottom: 12, fontWeight: '500' },

  recipeMetaRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingTop: 12, borderTopWidth: 1,
  },
  recipeMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recipeMetaText: { fontSize: 12, fontWeight: '500' },
  viewArrow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' },
  viewText: { fontSize: 12, fontWeight: '700' },

  emptyState: { alignItems: 'center', paddingVertical: 50, paddingHorizontal: 40 },
  emptyIconBg: {
    width: 110, height: 110, borderRadius: 55,
    justifyContent: 'center', alignItems: 'center', marginBottom: 18,
  },
  emptyTitle: { fontSize: 19, fontWeight: '800' },
  emptySubtitle: { fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 22 },
});
