import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addItem } from '../services/firestore';
import { predictExpiry } from '../services/ai';

const CATEGORIES = [
  { label: 'Fresh Produce', icon: 'leaf' },
  { label: 'Dairy & Eggs', icon: 'egg' },
  { label: 'Meat & Poultry', icon: 'nutrition' },
  { label: 'Fish & Seafood', icon: 'fish' },
  { label: 'Bakery', icon: 'cafe' },
  { label: 'Grains & Rice', icon: 'restaurant' },
  { label: 'Canned Goods', icon: 'cube' },
  { label: 'Snacks', icon: 'pizza' },
  { label: 'Beverages', icon: 'beer' },
  { label: 'Others', icon: 'ellipsis-horizontal' },
];

export default function ManualAddScreen({ navigation, route }) {
  const [name, setName] = useState(route.params?.barcode ? `Scanned Item (${route.params.barcode})` : '');
  const [category, setCategory] = useState('Others');
  const [expiryDays, setExpiryDays] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter a product name.');
      return;
    }

    setLoading(true);
    try {
      let days = parseInt(expiryDays);
      if (isNaN(days) || days <= 0) {
        days = predictExpiry(name);
      }

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + days);

      await addItem({
        name: name.trim(),
        category,
        expiryDate: expiryDate.toISOString(),
      });

      setLoading(false);
      setSaved(true);

      // Show success briefly then go back
      setTimeout(() => {
        navigation.navigate('Main');
      }, 800);

    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to save item. Please try again.\n' + error.message);
    }
  };

  if (saved) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="checkmark-circle" size={80} color="#2ECC71" />
        <Text style={{ color: '#fff', fontSize: 22, marginTop: 15, fontWeight: 'bold' }}>Item Saved!</Text>
        <Text style={{ color: '#888', fontSize: 14, marginTop: 8 }}>Redirecting to pantry...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.section}>
        <Text style={styles.label}>Product Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Milk, Bread, Apples"
          placeholderTextColor="#555"
          autoFocus
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Category</Text>
        <TouchableOpacity style={styles.selectButton} onPress={() => setShowCategoryModal(true)}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons
              name={CATEGORIES.find(c => c.label === category)?.icon || 'ellipsis-horizontal'}
              size={20} color="#2ECC71" style={{ marginRight: 10 }}
            />
            <Text style={styles.selectText}>{category}</Text>
          </View>
          <Ionicons name="chevron-down" size={20} color="#888" />
        </TouchableOpacity>
      </View>

      {/* Category Modal */}
      <Modal visible={showCategoryModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <FlatList
              data={CATEGORIES}
              keyExtractor={(item) => item.label}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, category === item.label && styles.modalItemSelected]}
                  onPress={() => { setCategory(item.label); setShowCategoryModal(false); }}
                >
                  <Ionicons name={item.icon} size={22} color={category === item.label ? '#2ECC71' : '#888'} />
                  <Text style={[styles.modalItemText, category === item.label && { color: '#2ECC71', fontWeight: 'bold' }]}>
                    {item.label}
                  </Text>
                  {category === item.label && <Ionicons name="checkmark" size={20} color="#2ECC71" />}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowCategoryModal(false)}>
              <Text style={{ color: '#fff', fontSize: 16 }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.section}>
        <Text style={styles.label}>Days until expiry</Text>
        <TextInput
          style={styles.input}
          value={expiryDays}
          onChangeText={setExpiryDays}
          keyboardType="numeric"
          placeholder="Leave blank to auto-predict based on product name"
          placeholderTextColor="#555"
        />
        {name.trim().length > 0 && !expiryDays && (
          <View style={styles.predictionBanner}>
            <Ionicons name="bulb" size={16} color="#f39c12" />
            <Text style={styles.predictionText}>
              AI predicts ~{predictExpiry(name)} days for "{name.trim()}"
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.saveButton, loading && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="save" size={20} color="#fff" />
            <Text style={styles.saveButtonText}>  Save Item</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  section: { marginBottom: 20 },
  label: { color: '#fff', fontSize: 16, marginBottom: 8, fontWeight: '600' },
  input: {
    backgroundColor: '#1E1E1E', color: '#fff', padding: 15,
    borderRadius: 10, fontSize: 16, borderWidth: 1, borderColor: '#333',
  },
  selectButton: {
    backgroundColor: '#1E1E1E', padding: 15, borderRadius: 10,
    borderWidth: 1, borderColor: '#333', flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
  },
  selectText: { color: '#fff', fontSize: 16 },
  predictionBanner: {
    flexDirection: 'row', alignItems: 'center', marginTop: 8,
    backgroundColor: '#2a2a1e', padding: 10, borderRadius: 8,
  },
  predictionText: { color: '#f39c12', fontSize: 13, marginLeft: 8, fontStyle: 'italic' },
  saveButton: {
    backgroundColor: '#2ECC71', padding: 16, borderRadius: 12,
    alignItems: 'center', marginTop: 10, marginBottom: 40,
    flexDirection: 'row', justifyContent: 'center',
  },
  saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#1E1E1E', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, maxHeight: '70%',
  },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  modalItem: {
    padding: 15, borderBottomWidth: 1, borderBottomColor: '#333',
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  modalItemSelected: { backgroundColor: '#1a2e1a' },
  modalItemText: { color: '#fff', fontSize: 16, flex: 1 },
  modalClose: { padding: 15, alignItems: 'center', marginTop: 10, backgroundColor: '#333', borderRadius: 10 },
});
