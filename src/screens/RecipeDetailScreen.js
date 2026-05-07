import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Image, TouchableOpacity, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../config/ThemeContext';

const { width } = Dimensions.get('window');

const getDifficultyColor = (level, theme) => {
  switch (level) {
    case 'Easy': return theme.safe;
    case 'Medium': return theme.warning;
    case 'Hard': return theme.danger;
    default: return theme.safe;
  }
};

export default function RecipeDetailScreen({ navigation, route }) {
  const { recipe } = route.params;
  const { theme } = useTheme();
  const diffColor = getDifficultyColor(recipe.difficulty, theme);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingBottom: 50 }}
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
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.heroTextBox}>
          <Text style={styles.heroEmoji}>{recipe.emoji}</Text>
          <Text style={styles.heroTitle}>{recipe.name}</Text>
          <Text style={styles.heroDesc} numberOfLines={2}>{recipe.description}</Text>
        </View>
      </View>

      {/* Meta Row (floating card) */}
      <View style={[styles.metaRow, { backgroundColor: theme.card, borderColor: theme.border, shadowOpacity: theme.isDark ? 0.4 : 0.12 }]}>
        <View style={styles.metaItem}>
          <View style={[styles.metaIcon, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="time-outline" size={18} color={theme.primaryDeep} />
          </View>
          <Text style={[styles.metaLabel, { color: theme.subText }]}>Cook Time</Text>
          <Text style={[styles.metaValue, { color: theme.text }]}>{recipe.time}</Text>
        </View>
        <View style={[styles.metaDivider, { backgroundColor: theme.divider }]} />
        <View style={styles.metaItem}>
          <View style={[styles.metaIcon, { backgroundColor: diffColor + '22' }]}>
            <Ionicons name="speedometer-outline" size={18} color={diffColor} />
          </View>
          <Text style={[styles.metaLabel, { color: theme.subText }]}>Difficulty</Text>
          <Text style={[styles.metaValue, { color: diffColor }]}>
            {recipe.difficulty}
          </Text>
        </View>
        <View style={[styles.metaDivider, { backgroundColor: theme.divider }]} />
        <View style={styles.metaItem}>
          <View style={[styles.metaIcon, { backgroundColor: theme.accentSoft }]}>
            <Ionicons name="people-outline" size={18} color={theme.accentDeep} />
          </View>
          <Text style={[styles.metaLabel, { color: theme.subText }]}>Servings</Text>
          <Text style={[styles.metaValue, { color: theme.text }]}>{recipe.servings}</Text>
        </View>
      </View>

      <View style={styles.body}>
        {recipe.matchCount > 0 && (
          <View style={[styles.matchBadge, { backgroundColor: theme.primarySoft, borderColor: theme.primary + '55' }]}>
            <Ionicons name="checkmark-circle" size={18} color={theme.primaryDeep} />
            <Text style={[styles.matchText, { color: theme.primaryDeep }]}>
              You have {recipe.matchCount} of the required ingredients
            </Text>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Ingredients</Text>
        <View style={[styles.ingredientBox, { backgroundColor: theme.card, borderColor: theme.border, shadowOpacity: theme.shadowOpacity }]}>
          {recipe.ingredients.map((ing, i) => (
            <View
              key={i}
              style={[
                styles.ingredientRow,
                i < recipe.ingredients.length - 1 && { borderBottomColor: theme.divider, borderBottomWidth: 1 },
              ]}
            >
              <View style={[styles.dot, { backgroundColor: theme.primary }]} />
              <Text style={[styles.ingredientText, { color: theme.text }]}>{ing}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Instructions</Text>
        {recipe.steps.map((step, i) => (
          <View
            key={i}
            style={[styles.stepRow, { backgroundColor: theme.card, borderColor: theme.border, shadowOpacity: theme.shadowOpacity }]}
          >
            <View style={[styles.stepNumber, { backgroundColor: theme.primaryDeep }]}>
              <Text style={styles.stepNumberText}>{i + 1}</Text>
            </View>
            <Text style={[styles.stepText, { color: theme.text }]}>{step}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  imageWrapper: { width, height: 280, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 40, 30, 0.45)',
  },
  backBtn: {
    position: 'absolute', top: 50, left: 16,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  heroTextBox: { position: 'absolute', bottom: 30, left: 20, right: 20 },
  heroEmoji: { fontSize: 32, marginBottom: 4 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', marginBottom: 6, letterSpacing: 0.3 },
  heroDesc: { fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 19, fontWeight: '500' },

  metaRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    padding: 16, marginHorizontal: 16, marginTop: -24,
    borderRadius: 18, borderWidth: 1,
    elevation: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowRadius: 10,
  },
  metaItem: { alignItems: 'center', gap: 4, flex: 1 },
  metaIcon: {
    width: 36, height: 36, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 4,
  },
  metaLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  metaValue: { fontSize: 14, fontWeight: '800', marginTop: 2 },
  metaDivider: { width: 1, height: '70%', alignSelf: 'center' },

  body: { padding: 20 },

  matchBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderRadius: 14, borderWidth: 1,
    marginBottom: 22,
  },
  matchText: { fontSize: 13, fontWeight: '700', flex: 1 },

  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12, marginTop: 4, letterSpacing: 0.3 },

  ingredientBox: {
    borderRadius: 14, overflow: 'hidden', marginBottom: 24,
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 3,
  },
  ingredientRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  ingredientText: { fontSize: 14, flex: 1, fontWeight: '500' },

  stepRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    padding: 16, borderRadius: 14, marginBottom: 10,
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 3,
  },
  stepNumber: {
    width: 30, height: 30, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  stepNumberText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  stepText: { flex: 1, fontSize: 14, lineHeight: 21, fontWeight: '500' },
});
