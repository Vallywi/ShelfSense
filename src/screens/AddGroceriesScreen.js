import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../config/ThemeContext';

export default function AddGroceriesScreen({ navigation }) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>How would you like to add groceries?</Text>
      
      <TouchableOpacity 
        style={[styles.optionCard, { backgroundColor: theme.card }]} 
        onPress={() => navigation.navigate('CameraScanner')}
      >
        <Ionicons name="barcode-outline" size={40} color={theme.primary} />
        <View style={styles.optionTextContainer}>
          <Text style={[styles.optionTitle, { color: theme.text }]}>Scan Barcode</Text>
          <Text style={[styles.optionSubtitle, { color: theme.subText }]}>Use camera to scan product barcode</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.optionCard, { backgroundColor: theme.card }]} 
        onPress={() => navigation.navigate('ManualAdd')}
      >
        <Ionicons name="pencil-outline" size={40} color={theme.primary} />
        <View style={styles.optionTextContainer}>
          <Text style={[styles.optionTitle, { color: theme.text }]}>Manual Insert</Text>
          <Text style={[styles.optionSubtitle, { color: theme.subText }]}>Type in the details yourself</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  optionCard: { 
    padding: 20, borderRadius: 15, 
    flexDirection: 'row', alignItems: 'center', marginBottom: 20 
  },
  optionTextContainer: { marginLeft: 20, flex: 1 },
  optionTitle: { fontSize: 18, fontWeight: 'bold' },
  optionSubtitle: { fontSize: 14, marginTop: 5 }
});
