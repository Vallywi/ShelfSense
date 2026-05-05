import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Modal, FlatList, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addItem } from '../services/firestore';
import { predictExpiry, getStatus } from '../services/ai';

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

function formatDateForInput(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDefaultExpiry(productName) {
  const days = predictExpiry(productName || '');
  const d = new Date();
  d.setDate(d.getDate() + days);
  return formatDateForInput(d);
}

export default function ManualAddScreen({ navigation, route }) {
  const initialName = route.params?.productName && route.params?.productName !== 'Product Name Not Found' 
    ? route.params.productName 
    : '';
  const initialCategory = route.params?.productCategory || 'Others';

  // If we have a scanned expiry date, use it; otherwise predict from name
  let initialExpiry = '';
  if (route.params?.detectedExpiryDate) {
    initialExpiry = formatDateForInput(new Date(route.params.detectedExpiryDate));
  } else if (route.params?.expiryDays) {
    const d = new Date();
    d.setDate(d.getDate() + parseInt(route.params.expiryDays));
    initialExpiry = formatDateForInput(d);
  } else if (initialName) {
    initialExpiry = getDefaultExpiry(initialName);
  }

  const [name, setName] = useState(initialName);
  const [category, setCategory] = useState(initialCategory);
  const [expiryDate, setExpiryDate] = useState(initialExpiry);
  const [quantity, setQuantity] = useState(route.params?.productSize ? `1 (${route.params.productSize})` : '1');
  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const productImage = route.params?.productImage;

  // When name changes and no expiry is set, auto-predict
  const handleNameChange = (text) => {
    setName(text);
    if (!expiryDate && text.trim().length > 2) {
      setExpiryDate(getDefaultExpiry(text));
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter a product name.');
      return;
    }

    if (!expiryDate) {
      Alert.alert('Missing Date', 'Please select an expiration date.');
      return;
    }

    setLoading(true);
    try {
      const expDate = new Date(expiryDate + 'T23:59:59');

      await addItem({
        name: name.trim(),
        category,
        quantity: quantity.trim(),
        expiryDate: expDate.toISOString(),
      });

      setLoading(false);
      setSaved(true);

      setTimeout(() => {
        navigation.navigate('Main');
      }, 800);

    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Failed to save item. Please try again.\n' + error.message);
    }
  };

  // Calculate status preview
  const statusPreview = expiryDate ? getStatus(new Date(expiryDate + 'T23:59:59').toISOString()) : null;
  const daysLeft = expiryDate ? Math.ceil((new Date(expiryDate + 'T23:59:59') - new Date()) / (1000 * 60 * 60 * 24)) : null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'safe': return '#27ae60';
      case 'soon': return '#f39c12';
      case 'urgent': return '#e67e22';
      case 'expired': return '#e74c3c';
      default: return '#888';
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
      {/* Scanned info banner */}
      {route.params?.barcode && (
        <View style={styles.scannedBanner}>
          <Ionicons name="barcode" size={18} color="#2ECC71" />
          <Text style={styles.scannedBannerText}>  Scanned: {route.params.barcode}</Text>
        </View>
      )}

      {/* Product Image Preview */}
      {productImage && (
        <View style={{ alignItems: 'center', marginVertical: 15 }}>
          <img src={productImage} style={{ width: 120, height: 120, objectFit: 'contain', borderRadius: 12, backgroundColor: '#fff' }} alt="Product" />
        </View>
      )}

      {/* Product Name */}
      <View style={styles.section}>
        <Text style={styles.label}>Product Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={handleNameChange}
          placeholder="e.g. Milk, Bread, Apples"
          placeholderTextColor="#555"
          autoFocus={!initialName}
        />
      </View>

      {/* Category */}
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

      {/* Quantity */}
      <View style={styles.section}>
        <Text style={styles.label}>Quantity / Size</Text>
        <TextInput
          style={styles.input}
          value={quantity}
          onChangeText={setQuantity}
          placeholder="e.g. 1, 500g, 2 boxes"
          placeholderTextColor="#555"
        />
      </View>

      {/* Expiration Date Picker */}
      <View style={styles.section}>
        <Text style={styles.label}>Expiration Date *</Text>
        {Platform.OS === 'web' ? (
          <View style={styles.dateInputWrapper}>
            <Ionicons name="calendar" size={20} color="#2ECC71" style={{ marginRight: 10 }} />
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              style={{
                backgroundColor: 'transparent',
                color: '#fff',
                border: 'none',
                fontSize: 16,
                flex: 1,
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </View>
        ) : (
          <TextInput
            style={styles.input}
            value={expiryDate}
            onChangeText={setExpiryDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#555"
          />
        )}

        {/* AI prediction hint */}
        {name.trim().length > 0 && (
          <TouchableOpacity
            style={styles.predictionBanner}
            onPress={() => setExpiryDate(getDefaultExpiry(name))}
          >
            <Ionicons name="bulb" size={16} color="#f39c12" />
            <Text style={styles.predictionText}>
              AI suggests ~{predictExpiry(name)} days for "{name.trim()}" — tap to use
            </Text>
          </TouchableOpacity>
        )}

        {/* Status Preview */}
        {statusPreview && (
          <View style={[styles.statusPreview, { borderColor: getStatusColor(statusPreview) }]}>
            <Text style={[styles.statusPreviewText, { color: getStatusColor(statusPreview) }]}>
              {statusPreview === 'expired' ? '⚠️ Already expired!' :
               statusPreview === 'urgent' ? `🔴 Expires in ${daysLeft} day(s) — use immediately` :
               statusPreview === 'soon' ? `🟡 Expires in ${daysLeft} days — plan to use soon` :
               `🟢 Safe — ${daysLeft} days until expiry`}
            </Text>
          </View>
        )}
      </View>

      {/* Save Button */}
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
  scannedBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a2e1a',
    padding: 12, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#2ECC7133',
  },
  scannedBannerText: { color: '#2ECC71', fontSize: 13, fontFamily: 'monospace' },
  section: { marginBottom: 20 },
  label: { color: '#fff', fontSize: 16, marginBottom: 8, fontWeight: '600' },
  input: {
    backgroundColor: '#1E1E1E', color: '#fff', padding: 15,
    borderRadius: 10, fontSize: 16, borderWidth: 1, borderColor: '#333',
  },
  dateInputWrapper: {
    backgroundColor: '#1E1E1E', padding: 15, borderRadius: 10,
    borderWidth: 1, borderColor: '#333', flexDirection: 'row', alignItems: 'center',
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
  predictionText: { color: '#f39c12', fontSize: 13, marginLeft: 8, fontStyle: 'italic', flex: 1 },
  statusPreview: {
    marginTop: 8, padding: 10, borderRadius: 8, borderWidth: 1,
    backgroundColor: '#1a1a1a',
  },
  statusPreviewText: { fontSize: 13, fontWeight: '600' },
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
