import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../config/ThemeContext';

export default function AddGroceriesScreen({ navigation }) {
  const { theme } = useTheme();

  const options = [
    {
      icon: 'barcode-outline',
      title: 'Scan Barcode',
      subtitle: 'Quickly add a product by scanning its barcode',
      route: 'CameraScanner',
      bg: theme.primarySoft,
      iconColor: theme.primaryDeep,
    },
    {
      icon: 'scan-outline',
      title: 'Scan Expiry Date',
      subtitle: 'Let AI read the expiry date from a photo',
      route: 'ExpiryScan',
      bg: theme.accentSoft,
      iconColor: theme.accentDeep,
    },
    {
      icon: 'create-outline',
      title: 'Add Manually',
      subtitle: 'Type in the product details yourself',
      route: 'ManualAdd',
      bg: theme.primarySoft,
      iconColor: theme.primaryDeep,
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.heroIcon, { backgroundColor: theme.primarySoft }]}>
        <Ionicons name="basket" size={36} color={theme.primaryDeep} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>Add Groceries</Text>
      <Text style={[styles.subtitle, { color: theme.subText }]}>
        Choose how you'd like to add an item to your pantry
      </Text>

      <View style={styles.optionList}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.route}
            style={[styles.optionCard, { backgroundColor: theme.card, borderColor: theme.border, shadowOpacity: theme.shadowOpacity }]}
            onPress={() => navigation.navigate(opt.route)}
            activeOpacity={0.85}
          >
            <View style={[styles.optionIcon, { backgroundColor: opt.bg }]}>
              <Ionicons name={opt.icon} size={26} color={opt.iconColor} />
            </View>
            <View style={styles.optionTextContainer}>
              <Text style={[styles.optionTitle, { color: theme.text }]}>{opt.title}</Text>
              <Text style={[styles.optionSubtitle, { color: theme.subText }]}>{opt.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.subText} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 30, alignItems: 'center', paddingBottom: 50 },
  heroIcon: {
    width: 80, height: 80, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 8, letterSpacing: 0.3 },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 32, fontWeight: '500', lineHeight: 20 },

  optionList: { width: '100%', gap: 12 },
  optionCard: {
    padding: 16, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 3,
  },
  optionIcon: {
    width: 50, height: 50, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  optionTextContainer: { flex: 1 },
  optionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 3 },
  optionSubtitle: { fontSize: 12, fontWeight: '500', lineHeight: 17 },
});
