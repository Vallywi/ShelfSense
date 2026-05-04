import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PantryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Pantries</Text>
      
      <View style={styles.card}>
        <Ionicons name="home" size={24} color="#2ECC71" />
        <Text style={styles.cardText}>My Main Pantry</Text>
      </View>

      <TouchableOpacity style={styles.button}>
        <Ionicons name="add-circle-outline" size={20} color="#fff" />
        <Text style={styles.buttonText}> Create New Pantry</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton}>
        <Ionicons name="people-outline" size={20} color="#2ECC71" />
        <Text style={styles.secondaryButtonText}> Join a Pantry</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  card: { backgroundColor: '#1E1E1E', padding: 20, borderRadius: 10, flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  cardText: { color: '#fff', fontSize: 18, marginLeft: 15, fontWeight: 'bold' },
  button: { backgroundColor: '#2ECC71', padding: 15, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  secondaryButton: { borderWidth: 1, borderColor: '#2ECC71', padding: 15, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  secondaryButtonText: { color: '#2ECC71', fontSize: 16, fontWeight: 'bold' }
});
