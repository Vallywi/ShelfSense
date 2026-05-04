import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AddGroceriesScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>How would you like to add groceries?</Text>
      
      <TouchableOpacity 
        style={styles.optionCard} 
        onPress={() => navigation.navigate('CameraScanner')}
      >
        <Ionicons name="barcode-outline" size={40} color="#2ECC71" />
        <View style={styles.optionTextContainer}>
          <Text style={styles.optionTitle}>Scan Barcode</Text>
          <Text style={styles.optionSubtitle}>Use camera to scan product barcode</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.optionCard} 
        onPress={() => navigation.navigate('ManualAdd')}
      >
        <Ionicons name="pencil-outline" size={40} color="#2ECC71" />
        <View style={styles.optionTextContainer}>
          <Text style={styles.optionTitle}>Manual Insert</Text>
          <Text style={styles.optionSubtitle}>Type in the details yourself</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 30, textAlign: 'center' },
  optionCard: { 
    backgroundColor: '#1E1E1E', padding: 20, borderRadius: 15, 
    flexDirection: 'row', alignItems: 'center', marginBottom: 20 
  },
  optionTextContainer: { marginLeft: 20, flex: 1 },
  optionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  optionSubtitle: { fontSize: 14, color: '#aaa', marginTop: 5 }
});
