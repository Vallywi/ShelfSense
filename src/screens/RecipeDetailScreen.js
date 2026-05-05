import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Image, TouchableOpacity, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../config/ThemeContext';

const { width } = Dimensions.get('window');

const DIFFICULTY_COLOR = { Easy: '#2ecc71', Medium: '#f39c12', Hard: '#e74c3c' };

export default function RecipeDetailScreen({ navigation, route }) {
  const { recipe } = route.params;
  const { theme } = useTheme();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Image */}
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: recipe.image }}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <View style={styles.imageOverlay} />
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.heroTextBox}>
          <Text style={styles.heroEmoji}>{recipe.emoji}</Text>
          <Text style={styles.heroTitle}>{recipe.name}</Text>
          <Text style={styles.heroDesc}>{recipe.description}</Text>
        </View>
      </View>

      {/* Meta Row */}
      <View style={[styles.metaRow, { backgroundColor: theme.card }]}>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={20} color={theme.primary} />
          <Text style={[styles.metaLabel, { color: theme.subText }]}>Cook Time</Text>
          <Text style={[styles.metaValue, { color: theme.text }]}>{recipe.time}</Text>
        </View>
        <View style={[styles.metaDivider, { backgroundColor: theme.border }]} />
        <View style={styles.metaItem}>
          <Ionicons name="speedometer-outline" size={20} color={DIFFICULTY_COLOR[recipe.difficulty] || theme.primary} />
          <Text style={[styles.metaLabel, { color: theme.subText }]}>Difficulty</Text>
          <Text style={[styles.metaValue, { color: DIFFICULTY_COLOR[recipe.difficulty] || theme.text }]}>
            {recipe.difficulty}
          </Text>
        </View>
        <View style={[styles.metaDivider, { backgroundColor: theme.border }]} />
        <View style={styles.metaItem}>
          <Ionicons name="people-outline" size={20} color={theme.primary} />
          <Text style={[styles.metaLabel, { color: theme.subText }]}>Servings</Text>
          <Text style={[styles.metaValue, { color: theme.text }]}>{recipe.servings}</Text>
        </View>
      </View>

      <View style={styles.body}>
        {/* Matched Pantry Ingredients */}
        {recipe.matchCount > 0 && (
          <View style={[styles.matchBadge, { backgroundColor: theme.primary + '18', borderColor: theme.primary + '44' }]}>
            <Ionicons name="checkmark-circle" size={16} color={theme.primary} />
            <Text style={[styles.matchText, { color: theme.primary }]}>
              You have {recipe.matchCount} of the required ingredients!
            </Text>
          </View>
        )}

        {/* Ingredients */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>🛒 Ingredients</Text>
        <View style={[styles.ingredientBox, { backgroundColor: theme.card }]}>
          {recipe.ingredients.map((ing, i) => (
            <View key={i} style={[styles.ingredientRow, i < recipe.ingredients.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
              <View style={[styles.dot, { backgroundColor: theme.primary }]} />
              <Text style={[styles.ingredientText, { color: theme.text }]}>{ing}</Text>
            </View>
          ))}
        </View>

        {/* Steps */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>👨‍🍳 Instructions</Text>
        {recipe.steps.map((step, i) => (
          <View key={i} style={[styles.stepRow, { backgroundColor: theme.card }]}>
            <View style={[styles.stepNumber, { backgroundColor: theme.primary }]}>
              <Text style={styles.stepNumberText}>{i + 1}</Text>
            </View>
            <Text style={[styles.stepText, { color: theme.text }]}>{step}</Text>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  imageWrapper: { width, height: 300, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  backBtn: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTextBox: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  heroEmoji: { fontSize: 36, marginBottom: 4 },
  heroTitle: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 6 },
  heroDesc: { fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 20 },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  metaItem: { alignItems: 'center', gap: 4 },
  metaLabel: { fontSize: 11, marginTop: 4 },
  metaValue: { fontSize: 15, fontWeight: '700' },
  metaDivider: { width: 1, height: '80%', alignSelf: 'center' },
  body: { padding: 20 },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  matchText: { fontSize: 14, fontWeight: '600' },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
    marginTop: 8,
    letterSpacing: 0.3,
  },
  ingredientBox: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 24,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  ingredientText: { fontSize: 15, flex: 1 },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  stepNumberText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  stepText: { flex: 1, fontSize: 15, lineHeight: 22 },
});
