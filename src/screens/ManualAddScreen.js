import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Modal, FlatList, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addItem, updateItem } from '../services/firestore';
import { predictExpiry, getStatus } from '../services/ai';
import { useTheme } from '../config/ThemeContext';

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
  } else if (route.params?.productExpiry) {
    initialExpiry = formatDateForInput(new Date(route.params.productExpiry));
  } else if (route.params?.expiryDays) {
    const d = new Date();
    d.setDate(d.getDate() + parseInt(route.params.expiryDays));
    initialExpiry = formatDateForInput(d);
  } else if (initialName) {
    initialExpiry = getDefaultExpiry(initialName);
  }

  const { theme } = useTheme();
  const editMode = route.params?.editMode || false;
  const itemId = route.params?.itemId || null;

  const [name, setName] = useState(initialName);
  const [category, setCategory] = useState(initialCategory);
  const [expiryDate, setExpiryDate] = useState(initialExpiry);
  const [quantity, setQuantity] = useState(route.params?.productQuantity || (route.params?.productSize ? `1 (${route.params.productSize})` : '1'));
  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [saved, setSaved] = useState(false);
  const [productImage, setProductImage] = useState(route.params?.productImage || null);
  
  const handleQtyChange = (delta) => {
    const match = String(quantity).match(/^(\d+)/);
    let num = match ? parseInt(match[1]) : 1;
    const suffix = String(quantity).replace(/^\d+/, '').trim();
    num = Math.max(0, num + delta);
    setQuantity(suffix ? `${num} ${suffix}` : `${num}`);
  };

  const triggerFileUpload = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => setProductImage(e.target.result);
          reader.readAsDataURL(file);
        }
      };
      input.click();
    }
  };

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
      // Validate date
      if (!expiryDate || isNaN(new Date(expiryDate).getTime())) {
        setLoading(false);
        Alert.alert('Invalid Date', 'Please select a valid expiration date.');
        return;
      }

      const expDate = new Date(expiryDate + (expiryDate.includes('T') ? '' : 'T23:59:59'));
      
      const itemData = {
        name: name.trim(),
        category,
        quantity: quantity.trim(),
        expiryDate: expDate.toISOString(),
        imageUrl: productImage, // Include the real product photo
      };

      if (editMode && itemId) {
        await updateItem(itemId, itemData);
      } else {
        await addItem(itemData);
      }

      setLoading(false);
      setSaved(true);

      setTimeout(() => {
        navigation.navigate('Main');
      }, 800);

    } catch (error) {
      setLoading(false);
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save item. Please try again.');
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
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="checkmark-circle" size={80} color={theme.safe} />
        <Text style={{ color: theme.text, fontSize: 22, marginTop: 15, fontWeight: 'bold' }}>Item Saved!</Text>
        <Text style={{ color: theme.subText, fontSize: 14, marginTop: 8 }}>Redirecting to pantry...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} keyboardShouldPersistTaps="handled">
      {/* Scanned info banner */}
      {route.params?.barcode && (
        <View style={styles.scannedBanner}>
          <Ionicons name="barcode" size={18} color="#2ECC71" />
          <Text style={styles.scannedBannerText}>  Scanned: {route.params.barcode}</Text>
        </View>
      )}

      {/* Product Image Section */}
      <View style={styles.imageSection}>
        {productImage ? (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: productImage }} style={styles.imagePreview} />
            <TouchableOpacity style={styles.removeImageBtn} onPress={() => setProductImage(null)}>
              <Ionicons name="close-circle" size={24} color="#e74c3c" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="camera-outline" size={40} color={theme.subText} />
            <Text style={{ color: theme.subText, marginTop: 8 }}>No photo added</Text>
          </View>
        )}
        
        {Platform.OS === 'web' && (
          <TouchableOpacity 
            style={[styles.uploadBtn, { backgroundColor: theme.primary }]} 
            onPress={triggerFileUpload}
          >
            <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
            <Text style={styles.uploadBtnText}> {productImage ? 'Change Photo' : 'Upload Photo'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Product Name */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.text }]}>Product Name *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
          value={name}
          onChangeText={handleNameChange}
          placeholder="e.g. Milk, Bread, Apples"
          placeholderTextColor={theme.subText}
          autoFocus={!initialName}
        />
      </View>

      {/* Category */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.text }]}>Category</Text>
        <TouchableOpacity style={[styles.selectButton, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => setShowCategoryModal(true)}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons
              name={CATEGORIES.find(c => c.label === category)?.icon || 'ellipsis-horizontal'}
              size={20} color={theme.primary} style={{ marginRight: 10 }}
            />
            <Text style={[styles.selectText, { color: theme.text }]}>{category}</Text>
          </View>
          <Ionicons name="chevron-down" size={20} color={theme.subText} />
        </TouchableOpacity>
      </View>

      {/* Category Modal */}
      <Modal visible={showCategoryModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Select Category</Text>
            <FlatList
              data={CATEGORIES}
              keyExtractor={(item) => item.label}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, { borderBottomColor: theme.border }, category === item.label && { backgroundColor: theme.card }]}
                  onPress={() => { setCategory(item.label); setShowCategoryModal(false); }}
                >
                  <Ionicons name={item.icon} size={22} color={category === item.label ? theme.primary : theme.subText} />
                  <Text style={[styles.modalItemText, { color: theme.text }, category === item.label && { color: theme.primary, fontWeight: 'bold' }]}>
                    {item.label}
                  </Text>
                  {category === item.label && <Ionicons name="checkmark" size={20} color={theme.primary} />}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={[styles.modalClose, { backgroundColor: theme.card }]} onPress={() => setShowCategoryModal(false)}>
              <Text style={{ color: theme.text, fontSize: 16 }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Quantity */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.text }]}>Quantity / Size</Text>
        <View style={styles.qtyRow}>
          <TouchableOpacity onPress={() => handleQtyChange(-1)} style={[styles.qtyControl, { backgroundColor: theme.card }]}>
            <Ionicons name="remove" size={24} color={theme.text} />
          </TouchableOpacity>
          
          <TextInput
            style={[styles.input, { flex: 1, backgroundColor: theme.card, color: theme.text, borderColor: theme.border, textAlign: 'center' }]}
            value={quantity}
            onChangeText={setQuantity}
            placeholder="e.g. 1, 500g, 2 boxes"
            placeholderTextColor={theme.subText}
          />

          <TouchableOpacity onPress={() => handleQtyChange(1)} style={[styles.qtyControl, { backgroundColor: theme.card }]}>
            <Ionicons name="add" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Expiration Date Picker */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.text }]}>Expiration Date *</Text>
        {Platform.OS === 'web' ? (
          <View style={[styles.dateInputWrapper, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="calendar" size={20} color={theme.primary} style={{ marginRight: 10 }} />
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              style={{
                backgroundColor: 'transparent',
                color: theme.text,
                border: 'none',
                fontSize: 16,
                flex: 1,
                outline: 'none',
                fontFamily: 'inherit',
                colorScheme: theme.isDark ? 'dark' : 'light'
              }}
            />
          </View>
        ) : (
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
            value={expiryDate}
            onChangeText={setExpiryDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={theme.subText}
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
            <Text style={styles.saveButtonText}>  {editMode ? 'Update Item' : 'Save Item'}</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  scannedBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a2e1a',
    padding: 12, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#2ECC7133',
  },
  scannedBannerText: { color: '#2ECC71', fontSize: 13, fontFamily: 'monospace' },
  section: { marginBottom: 20 },
  label: { fontSize: 16, marginBottom: 8, fontWeight: '600' },
  input: {
    padding: 15, borderRadius: 10, fontSize: 16, borderWidth: 1,
  },
  dateInputWrapper: {
    padding: 15, borderRadius: 10, borderWidth: 1, flexDirection: 'row', alignItems: 'center',
  },
  selectButton: {
    padding: 15, borderRadius: 10, borderWidth: 1, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
  },
  selectText: { fontSize: 16 },
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
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyControl: { width: 50, height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  imageSection: { alignItems: 'center', marginVertical: 20 },
  imagePreviewContainer: { position: 'relative' },
  imagePreview: { width: 140, height: 140, borderRadius: 15, objectFit: 'cover', backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd' },
  removeImageBtn: { position: 'absolute', top: -10, right: -10, backgroundColor: '#fff', borderRadius: 12 },
  imagePlaceholder: { width: 140, height: 140, borderRadius: 15, borderStyle: 'dashed', borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  uploadBtn: { 
    marginTop: 15, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, 
    flexDirection: 'row', alignItems: 'center', cursor: 'pointer' 
  },
  uploadBtnText: { color: '#fff', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '70%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  modalItem: { padding: 15, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalItemText: { fontSize: 16, flex: 1 },
  modalClose: { padding: 15, alignItems: 'center', marginTop: 10, borderRadius: 10 },
});
