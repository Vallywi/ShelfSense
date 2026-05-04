import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { subscribeToItems } from '../services/firestore';
import { suggestRecipe, getRecommendation } from '../services/ai';

const RECIPE_DATABASE = [
  {
    keywords: ['egg', 'bread'],
    name: '🍞 French Toast',
    description: 'Beat eggs, dip bread slices, and pan-fry until golden. Top with syrup or fruits.',
    time: '15 mins',
    difficulty: 'Easy',
  },
  {
    keywords: ['sardines'],
    name: '🍝 Sardines with Noodles',
    description: 'Sauté garlic and onion, add sardines, toss with cooked noodles. Season to taste.',
    time: '20 mins',
    difficulty: 'Easy',
  },
  {
    keywords: ['chicken', 'rice'],
    name: '🍗 Chicken Fried Rice',
    description: 'Stir-fry diced chicken with day-old rice, soy sauce, and vegetables.',
    time: '25 mins',
    difficulty: 'Medium',
  },
  {
    keywords: ['milk', 'egg'],
    name: '🍮 Simple Custard',
    description: 'Whisk milk, eggs, sugar, and vanilla. Bake in a water bath at 350°F for 45 mins.',
    time: '60 mins',
    difficulty: 'Medium',
  },
  {
    keywords: ['bread', 'cheese'],
    name: '🧀 Grilled Cheese Sandwich',
    description: 'Butter bread, add cheese slices, and grill on a pan until melty and golden.',
    time: '10 mins',
    difficulty: 'Easy',
  },
];

function getMatchingRecipes(items) {
  if (!items || items.length === 0) return [];

  const names = items.map(i => i.name.toLowerCase());
  const matched = [];

  for (const recipe of RECIPE_DATABASE) {
    const matchCount = recipe.keywords.filter(kw =>
      names.some(n => n.includes(kw))
    ).length;

    if (matchCount > 0) {
      matched.push({ ...recipe, matchCount });
    }
  }

  // Sort by number of matching ingredients
  matched.sort((a, b) => b.matchCount - a.matchCount);
  return matched;
}

export default function RecipesScreen() {
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
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.loadingText}>Loading recipes...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Ionicons name="restaurant" size={40} color="#2ECC71" />
        <Text style={styles.title}>Recipe Ideas</Text>
        <Text style={styles.subtitle}>Smart suggestions based on your pantry items</Text>
      </View>

      {expiringItems.length > 0 && (
        <View style={styles.urgentCard}>
          <View style={styles.urgentHeader}>
            <Ionicons name="flash" size={20} color="#f39c12" />
            <Text style={styles.urgentTitle}>  Use These Soon!</Text>
          </View>
          <View style={styles.chipRow}>
            {expiringItems.map(item => (
              <View key={item.id} style={[styles.chip, { borderColor: item.status === 'expired' ? '#e74c3c' : '#f39c12' }]}>
                <Text style={styles.chipText}>{item.name}</Text>
              </View>
            ))}
          </View>
          <View style={styles.quickSuggestion}>
            <Ionicons name="bulb" size={16} color="#2ECC71" />
            <Text style={styles.quickSuggestionText}>  AI Suggestion: {quickSuggestion}</Text>
          </View>
        </View>
      )}

      {matchingRecipes.length > 0 ? (
        <View>
          <Text style={styles.sectionTitle}>Recipes You Can Make</Text>
          {matchingRecipes.map((recipe, index) => (
            <View key={index} style={styles.recipeCard}>
              <Text style={styles.recipeName}>{recipe.name}</Text>
              <Text style={styles.recipeDescription}>{recipe.description}</Text>
              <View style={styles.recipeMetaRow}>
                <View style={styles.recipeMeta}>
                  <Ionicons name="time-outline" size={14} color="#888" />
                  <Text style={styles.recipeMetaText}> {recipe.time}</Text>
                </View>
                <View style={styles.recipeMeta}>
                  <Ionicons name="speedometer-outline" size={14} color="#888" />
                  <Text style={styles.recipeMetaText}> {recipe.difficulty}</Text>
                </View>
                <View style={styles.recipeMeta}>
                  <Ionicons name="checkmark-circle" size={14} color="#2ECC71" />
                  <Text style={[styles.recipeMetaText, { color: '#2ECC71' }]}> {recipe.matchCount} ingredient(s) ready</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="basket-outline" size={60} color="#333" />
          <Text style={styles.emptyTitle}>No items in your pantry</Text>
          <Text style={styles.emptySubtitle}>Add items to get personalized recipe suggestions</Text>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={60} color="#333" />
          <Text style={styles.emptyTitle}>No matching recipes found</Text>
          <Text style={styles.emptySubtitle}>Add more items to unlock recipe ideas</Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  header: { alignItems: 'center', marginBottom: 25, marginTop: 10 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginTop: 10 },
  subtitle: { fontSize: 14, color: '#888', marginTop: 5 },
  loadingText: { color: '#aaa', fontSize: 16 },
  urgentCard: {
    backgroundColor: '#2a2a1e', padding: 16, borderRadius: 12,
    borderWidth: 1, borderColor: '#f39c1244', marginBottom: 20,
  },
  urgentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  urgentTitle: { color: '#f39c12', fontSize: 16, fontWeight: 'bold' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  chipText: { color: '#fff', fontSize: 13 },
  quickSuggestion: { flexDirection: 'row', alignItems: 'center' },
  quickSuggestionText: { color: '#2ECC71', fontSize: 14, fontStyle: 'italic' },
  sectionTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  recipeCard: {
    backgroundColor: '#1E1E1E', padding: 16, borderRadius: 12, marginBottom: 12,
  },
  recipeName: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  recipeDescription: { color: '#bbb', fontSize: 14, lineHeight: 20, marginBottom: 12 },
  recipeMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
  recipeMeta: { flexDirection: 'row', alignItems: 'center' },
  recipeMetaText: { color: '#888', fontSize: 12 },
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyTitle: { color: '#aaa', fontSize: 18, marginTop: 15, fontWeight: 'bold' },
  emptySubtitle: { color: '#666', fontSize: 14, marginTop: 8, textAlign: 'center' },
});
