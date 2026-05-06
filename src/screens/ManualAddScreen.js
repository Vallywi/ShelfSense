import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Modal, FlatList, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addItem, updateItem } from '../services/firestore';
import { predictExpiry, getStatus } from '../services/ai';
import { useTheme } from '../config/ThemeContext';
import { useToast } from '../config/ToastContext';

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
  const { showToast } = useToast();
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
  const productNutrition = route.params?.productNutrition || null;

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
        imageUrl: productImage,
        nutrition: productNutrition,
      };

      if (editMode && itemId) {
        await updateItem(itemId, itemData);
      } else {
        await addItem(itemData);
      }

      setLoading(false);
      setSaved(true);
      showToast(editMode ? 'Item updated' : `${name.trim()} added to pantry`, 'success');

      setTimeout(() => {
        navigation.navigate('Main');
      }, 800);
    } catch (error) {
      setLoading(false);
      console.error('Save error:', error);
      showToast('Failed to save item — please try again', 'error');
    }
  };

  const statusPreview = expiryDate ? getStatus(new Date(expiryDate + 'T23:59:59').toISOString()) : null;
  const daysLeft = expiryDate ? Math.ceil((new Date(expiryDate + 'T23:59:59') - new Date()) / (1000 * 60 * 60 * 24)) : null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'safe': return theme.safe;
      case 'soon': return theme.warning;
      case 'urgent': return '#E89274';
      case 'expired': return theme.danger;
      default: return theme.subText;
    }
  };

  if (saved) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <View style={[styles.savedIconBg, { backgroundColor: theme.primarySoft }]}>
          <Ionicons name="checkmark-circle" size={64} color={theme.safe} />
        </View>
        <Text style={{ color: theme.text, fontSize: 22, marginTop: 16, fontWeight: '800' }}>Item Saved!</Text>
        <Text style={{ color: theme.subText, fontSize: 14, marginTop: 8, fontWeight: '500' }}>Redirecting to pantry...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
      keyboardShouldPersistTaps="handled"
    >
      {route.params?.barcode && (
        <View style={[styles.scannedBanner, { backgroundColor: theme.primarySoft, borderColor: theme.primary + '55' }]}>
          <Ionicons name="barcode" size={16} color={theme.primaryDeep} />
          <Text style={[styles.scannedBannerText, { color: theme.primaryDeep }]}>Scanned: {route.params.barcode}</Text>
        </View>
      )}

      {productNutrition && (
        <View style={[styles.scannedBanner, { backgroundColor: theme.accentSoft, borderColor: theme.accent + '55' }]}>
          <Ionicons name="nutrition-outline" size={16} color={theme.accentDeep} />
          <Text style={[styles.scannedBannerText, { color: theme.accentDeep }]}>
            Nutrition info captured ({productNutrition.calories ? `${productNutrition.calories} kcal/100g` : 'partial'})
          </Text>
        </View>
      )}

      {/* Image */}
      <View style={styles.imageSection}>
        {productImage ? (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: productImage }} style={[styles.imagePreview, { borderColor: theme.border }]} />
            <TouchableOpacity
              style={[styles.removeImageBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => setProductImage(null)}
            >
              <Ionicons name="close" size={18} color={theme.danger} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="image-outline" size={36} color={theme.subText} />
            <Text style={{ color: theme.subText, marginTop: 8, fontWeight: '500', fontSize: 12 }}>No photo</Text>
          </View>
        )}

        {Platform.OS === 'web' && (
          <TouchableOpacity
            style={[styles.uploadBtn, { backgroundColor: theme.primaryDeep }]}
            onPress={triggerFileUpload}
            activeOpacity={0.85}
          >
            <Ionicons name="cloud-upload-outline" size={16} color="#FFFFFF" />
            <Text style={styles.uploadBtnText}>{productImage ? 'Change Photo' : 'Upload Photo'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Product Name */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.subText }]}>PRODUCT NAME *</Text>
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
        <Text style={[styles.label, { color: theme.subText }]}>CATEGORY</Text>
        <TouchableOpacity
          style={[styles.selectButton, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => setShowCategoryModal(true)}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[styles.categoryIconBg, { backgroundColor: theme.primarySoft }]}>
              <Ionicons
                name={CATEGORIES.find(c => c.label === category)?.icon || 'ellipsis-horizontal'}
                size={16} color={theme.primaryDeep}
              />
            </View>
            <Text style={[styles.selectText, { color: theme.text }]}>{category}</Text>
          </View>
          <Ionicons name="chevron-down" size={18} color={theme.subText} />
        </TouchableOpacity>
      </View>

      {/* Quantity */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.subText }]}>QUANTITY / SIZE</Text>
        <View style={styles.qtyRow}>
          <TouchableOpacity
            onPress={() => handleQtyChange(-1)}
            style={[styles.qtyControl, { backgroundColor: theme.card, borderColor: theme.border }]}
            activeOpacity={0.7}
          >
            <Ionicons name="remove" size={22} color={theme.text} />
          </TouchableOpacity>

          <TextInput
            style={[styles.input, styles.qtyInput, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
            value={quantity}
            onChangeText={setQuantity}
            placeholder="e.g. 1, 500g"
            placeholderTextColor={theme.subText}
          />

          <TouchableOpacity
            onPress={() => handleQtyChange(1)}
            style={[styles.qtyControl, { backgroundColor: theme.primaryDeep, borderColor: theme.primaryDeep }]}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Expiry */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.subText }]}>EXPIRATION DATE *</Text>
        {Platform.OS === 'web' ? (
          <View style={[styles.dateInputWrapper, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="calendar" size={18} color={theme.primaryDeep} style={{ marginRight: 10 }} />
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              style={{
                backgroundColor: 'transparent',
                color: theme.text,
                border: 'none',
                fontSize: 15,
                flex: 1,
                outline: 'none',
                fontFamily: 'inherit',
                colorScheme: theme.isDark ? 'dark' : 'light',
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

        {name.trim().length > 0 && (
          <TouchableOpacity
            style={[styles.predictionBanner, { backgroundColor: theme.warningSoft, borderColor: theme.warning + '55' }]}
            onPress={() => setExpiryDate(getDefaultExpiry(name))}
            activeOpacity={0.85}
          >
            <Ionicons name="bulb" size={15} color={theme.warning} />
            <Text style={[styles.predictionText, { color: theme.warning }]}>
              AI suggests ~{predictExpiry(name)} days for "{name.trim()}" — tap to use
            </Text>
          </TouchableOpacity>
        )}

        {statusPreview && (
          <View style={[styles.statusPreview, { borderColor: getStatusColor(statusPreview), backgroundColor: getStatusColor(statusPreview) + '15' }]}>
            <Ionicons
              name={
                statusPreview === 'expired' ? 'alert-circle' :
                statusPreview === 'urgent' ? 'warning' :
                statusPreview === 'soon' ? 'time' :
                'checkmark-circle'
              }
              size={16}
              color={getStatusColor(statusPreview)}
            />
            <Text style={[styles.statusPreviewText, { color: getStatusColor(statusPreview) }]}>
              {statusPreview === 'expired' ? 'Already expired!' :
                statusPreview === 'urgent' ? `Expires in ${daysLeft} day(s) — use immediately` :
                  statusPreview === 'soon' ? `Expires in ${daysLeft} days — plan to use soon` :
                    `Safe — ${daysLeft} days until expiry`}
            </Text>
          </View>
        )}
      </View>

      {/* Save */}
      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: theme.primaryDeep, shadowColor: theme.primaryDeep }, loading && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="save-outline" size={20} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>{editMode ? 'Update Item' : 'Save Item'}</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Category Modal */}
      <Modal visible={showCategoryModal} transparent animationType="slide" onRequestClose={() => setShowCategoryModal(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>Select Category</Text>
            <FlatList
              data={CATEGORIES}
              keyExtractor={(item) => item.label}
              renderItem={({ item }) => {
                const selected = category === item.label;
                return (
                  <TouchableOpacity
                    style={[
                      styles.modalItem,
                      { borderBottomColor: theme.divider },
                      selected && { backgroundColor: theme.primarySoft },
                    ]}
                    onPress={() => { setCategory(item.label); setShowCategoryModal(false); }}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.modalItemIcon, { backgroundColor: selected ? theme.primary : theme.surface }]}>
                      <Ionicons
                        name={item.icon}
                        size={18}
                        color={selected ? '#FFFFFF' : theme.subText}
                      />
                    </View>
                    <Text style={[styles.modalItemText, { color: selected ? theme.primaryDeep : theme.text, fontWeight: selected ? '700' : '500' }]}>
                      {item.label}
                    </Text>
                    {selected && <Ionicons name="checkmark" size={20} color={theme.primaryDeep} />}
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity
              style={[styles.modalClose, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => setShowCategoryModal(false)}
              activeOpacity={0.8}
            >
              <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scannedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 12, marginBottom: 18,
    borderWidth: 1,
  },
  scannedBannerText: { fontSize: 13, fontFamily: 'monospace', fontWeight: '700' },

  section: { marginBottom: 18 },
  label: {
    fontSize: 11, marginBottom: 8, fontWeight: '700',
    letterSpacing: 1, textTransform: 'uppercase',
  },
  input: {
    paddingHorizontal: 14, paddingVertical: 14,
    borderRadius: 12, fontSize: 15, borderWidth: 1,
  },

  dateInputWrapper: {
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center',
  },
  selectButton: {
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 12, borderWidth: 1,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  categoryIconBg: {
    width: 30, height: 30, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  selectText: { fontSize: 15, fontWeight: '600' },

  predictionBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 10, paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1,
  },
  predictionText: { fontSize: 12, fontWeight: '600', flex: 1 },

  statusPreview: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 10, padding: 12, borderRadius: 10, borderWidth: 1.5,
  },
  statusPreviewText: { fontSize: 13, fontWeight: '700', flex: 1 },

  saveButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: 14, marginTop: 14, gap: 10,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8,
  },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyControl: {
    width: 50, height: 50, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1,
  },
  qtyInput: { flex: 1, textAlign: 'center', fontWeight: '700' },

  imageSection: { alignItems: 'center', marginBottom: 22 },
  imagePreviewContainer: { position: 'relative' },
  imagePreview: {
    width: 130, height: 130, borderRadius: 16,
    backgroundColor: '#FFFFFF', borderWidth: 1,
  },
  removeImageBtn: {
    position: 'absolute', top: -8, right: -8,
    width: 30, height: 30, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
  },
  imagePlaceholder: {
    width: 130, height: 130, borderRadius: 16,
    borderStyle: 'dashed', borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center',
  },
  uploadBtn: {
    marginTop: 14, paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 22, gap: 6,
    flexDirection: 'row', alignItems: 'center',
  },
  uploadBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },

  savedIconBg: {
    width: 110, height: 110, borderRadius: 55,
    justifyContent: 'center', alignItems: 'center',
  },

  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: '75%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 14, textAlign: 'center' },
  modalItem: {
    paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1,
    flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 10,
  },
  modalItemIcon: {
    width: 34, height: 34, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  modalItemText: { fontSize: 15, flex: 1 },
  modalClose: {
    paddingVertical: 14, alignItems: 'center', marginTop: 12,
    borderRadius: 12, borderWidth: 1,
  },
});
