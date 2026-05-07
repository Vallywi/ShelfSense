import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../config/ThemeContext';

let Html5Qrcode = null;
if (Platform.OS === 'web') {
  Html5Qrcode = require('html5-qrcode').Html5Qrcode;
}

function mapCategory(apiCategories) {
  if (!apiCategories) return 'Others';
  const lowerCats = apiCategories.toLowerCase();
  if (lowerCats.includes('dairy') || lowerCats.includes('milk') || lowerCats.includes('cheese')) return 'Dairy & Eggs';
  if (lowerCats.includes('meat') || lowerCats.includes('poultry') || lowerCats.includes('beef') || lowerCats.includes('pork') || lowerCats.includes('chicken')) return 'Meat & Poultry';
  if (lowerCats.includes('fish') || lowerCats.includes('seafood') || lowerCats.includes('tuna')) return 'Fish & Seafood';
  if (lowerCats.includes('plant-based') || lowerCats.includes('vegetable') || lowerCats.includes('fruit')) return 'Fresh Produce';
  if (lowerCats.includes('bread') || lowerCats.includes('bakery') || lowerCats.includes('pastries')) return 'Bakery';
  if (lowerCats.includes('cereal') || lowerCats.includes('rice') || lowerCats.includes('grain') || lowerCats.includes('pasta') || lowerCats.includes('noodle')) return 'Grains & Rice';
  if (lowerCats.includes('canned')) return 'Canned Goods';
  if (lowerCats.includes('snack') || lowerCats.includes('chip') || lowerCats.includes('chocolate') || lowerCats.includes('sweet')) return 'Snacks';
  if (lowerCats.includes('beverage') || lowerCats.includes('drink') || lowerCats.includes('water')) return 'Beverages';
  return 'Others';
}

async function lookupBarcodeAPI(code) {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
    const data = await res.json();
    if (data.status === 1 && data.product) {
      const p = data.product;
      const name = p.product_name || p.generic_name || p.brands || `Product (${code})`;
      const category = mapCategory(p.categories);
      const imageUrl = p.image_front_url || p.image_url || null;
      const quantity = p.quantity || null;

      // Extract nutrition (per 100g/ml as base)
      const n = p.nutriments || {};
      const nutrition = {
        calories: numOrNull(n['energy-kcal_100g']) ?? numOrNull(n['energy-kcal']) ?? null,
        protein: numOrNull(n['proteins_100g']),
        carbs: numOrNull(n['carbohydrates_100g']),
        fat: numOrNull(n['fat_100g']),
        sugar: numOrNull(n['sugars_100g']),
        fiber: numOrNull(n['fiber_100g']),
        salt: numOrNull(n['salt_100g']),
        servingSize: p.serving_size || null,
        nutritionGrade: p.nutriscore_grade || null,
      };
      const hasAnyNutrition = Object.values(nutrition).some(v => v !== null);

      return { name, category, imageUrl, quantity, nutrition: hasAnyNutrition ? nutrition : null };
    }
  } catch (error) {
    console.error('API lookup error:', error);
  }
  return { name: 'Product Name Not Found', category: 'Others', isUnknown: true };
}

function numOrNull(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : null;
}

export default function CameraScreen({ navigation }) {
  const { theme } = useTheme();
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [productInfo, setProductInfo] = useState(null);
  const [error, setError] = useState(null);
  const [autoDetecting, setAutoDetecting] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (Platform.OS === 'web' && Html5Qrcode) {
      startScanner();
    }
    return () => { stopScanner(); };
  }, []);

  const startScanner = async () => {
    try {
      setError(null);
      setScanning(true);
      setScannedData(null);
      setProductInfo(null);

      await new Promise(resolve => setTimeout(resolve, 200));

      const scanner = new Html5Qrcode('barcode-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 15, qrbox: { width: 280, height: 150 }, aspectRatio: 1.0 },
        async (decodedText) => {
          setScannedData(decodedText);
          setScanning(false);
          setAutoDetecting(true);
          stopScanner();

          const product = await lookupBarcodeAPI(decodedText);
          setProductInfo(product);

          setTimeout(() => {
            setAutoDetecting(false);
            navigation.navigate('ExpiryScan', {
              barcode: decodedText,
              productName: product.name,
              productCategory: product.category,
              productImage: product.imageUrl,
              productSize: product.quantity,
              productNutrition: product.nutrition || null,
              isUnknown: product.isUnknown,
            });
          }, 2500);
        },
        () => { /* miss */ }
      );
    } catch (err) {
      setError('Could not access camera. Please allow camera access and try again.');
      setScanning(false);
      console.error('Scanner error:', err);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) await scannerRef.current.stop();
      } catch (e) {}
      try { scannerRef.current.clear(); } catch (e) {}
      scannerRef.current = null;
    }
  };

  const handleManualSkip = () => {
    stopScanner();
    navigation.navigate('ManualAdd');
  };

  if (Platform.OS !== 'web') {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <View style={[styles.iconBg, { backgroundColor: theme.primarySoft }]}>
          <Ionicons name="camera-outline" size={56} color={theme.primary} />
        </View>
        <Text style={[styles.errorText, { color: theme.text }]}>Camera scanning is available on the web/PWA version.</Text>
        <TouchableOpacity
          style={[styles.manualBtn, { backgroundColor: theme.primaryDeep }]}
          onPress={() => navigation.navigate('ManualAdd')}
          activeOpacity={0.85}
        >
          <Text style={styles.manualBtnText}>Switch to manual input</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {scanning && !scannedData && (
        <View style={styles.scannerArea}>
          <div id="barcode-reader" style={{ width: '100%', height: '100%' }} />

          <View style={styles.scanFrame}>
            <View style={[styles.cornerTL, { borderColor: theme.primary }]} />
            <View style={[styles.cornerTR, { borderColor: theme.primary }]} />
            <View style={[styles.cornerBL, { borderColor: theme.primary }]} />
            <View style={[styles.cornerBR, { borderColor: theme.primary }]} />
          </View>

          <View style={styles.scanOverlayBottom}>
            <View style={[styles.scanPulse, { backgroundColor: 'rgba(0,0,0,0.75)' }]}>
              <Ionicons name="scan" size={18} color={theme.primary} />
              <Text style={[styles.scanInstruction, { color: theme.primary }]}>Scanning... Point at barcode</Text>
            </View>
          </View>
        </View>
      )}

      {error && (
        <View style={styles.centered}>
          <View style={[styles.iconBg, { backgroundColor: theme.dangerSoft }]}>
            <Ionicons name="alert-circle" size={48} color={theme.danger} />
          </View>
          <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: theme.primaryDeep }]}
            onPress={() => { setError(null); startScanner(); }}
            activeOpacity={0.85}
          >
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {scannedData && (
        <View style={styles.resultContainer}>
          <View style={[styles.iconBg, { backgroundColor: theme.safeSoft }]}>
            <Ionicons name="checkmark-circle" size={56} color={theme.safe} />
          </View>
          <Text style={[styles.resultTitle, { color: theme.text }]}>Barcode Detected</Text>
          <Text style={[styles.resultCode, { color: theme.subText, backgroundColor: theme.surface, borderColor: theme.border }]}>
            {scannedData}
          </Text>

          {autoDetecting && !productInfo && (
            <View style={[styles.productCard, { backgroundColor: theme.card, borderColor: theme.border, paddingVertical: 36 }]}>
              <ActivityIndicator size="large" color={theme.primaryDeep} />
              <Text style={[styles.autoText, { marginTop: 14, color: theme.subText }]}>Fetching product info...</Text>
            </View>
          )}

          {productInfo && (
            <View
              style={[
                styles.productCard,
                {
                  backgroundColor: theme.card,
                  borderColor: productInfo.isUnknown ? theme.warning : theme.border,
                  shadowOpacity: theme.shadowOpacity,
                },
              ]}
            >
              {productInfo.imageUrl ? (
                <img
                  src={productInfo.imageUrl}
                  style={{
                    width: 100, height: 100, objectFit: 'contain',
                    marginBottom: 14, borderRadius: 14, backgroundColor: '#FFFFFF',
                    padding: 6,
                  }}
                  alt="Product"
                />
              ) : (
                <View style={[styles.productIconBg, { backgroundColor: productInfo.isUnknown ? theme.warningSoft : theme.primarySoft }]}>
                  <Ionicons
                    name={productInfo.isUnknown ? 'help-circle' : 'cube'}
                    size={36}
                    color={productInfo.isUnknown ? theme.warning : theme.primaryDeep}
                  />
                </View>
              )}

              <Text style={[styles.productName, { color: theme.text }]}>{productInfo.name}</Text>

              {!productInfo.isUnknown && (
                <View style={styles.badgesRow}>
                  <View style={[styles.badge, { backgroundColor: theme.primarySoft }]}>
                    <Text style={[styles.badgeText, { color: theme.primaryDeep }]}>{productInfo.category}</Text>
                  </View>
                  {productInfo.quantity && (
                    <View style={[styles.badge, { backgroundColor: theme.accentSoft }]}>
                      <Text style={[styles.badgeText, { color: theme.accentDeep }]}>{productInfo.quantity}</Text>
                    </View>
                  )}
                </View>
              )}

              {productInfo.isUnknown && (
                <Text style={[styles.productCategory, { color: theme.subText }]}>
                  Not in global database. You can enter the name on the next step.
                </Text>
              )}
            </View>
          )}

          {autoDetecting && productInfo && (
            <View style={styles.autoProgress}>
              <ActivityIndicator size="small" color={theme.primaryDeep} />
              <Text style={[styles.autoText, { color: theme.subText }]}>Proceeding to expiry scanner...</Text>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity
        style={[styles.skipBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={handleManualSkip}
        activeOpacity={0.85}
      >
        <Ionicons name="create-outline" size={18} color={theme.primaryDeep} />
        <Text style={[styles.skipBtnText, { color: theme.primaryDeep }]}>Skip — Enter manually instead</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },

  iconBg: {
    width: 100, height: 100, borderRadius: 50,
    justifyContent: 'center', alignItems: 'center',
  },

  scannerArea: {
    flex: 1, position: 'relative', overflow: 'hidden',
    backgroundColor: '#000',
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  scanFrame: {
    position: 'absolute', top: '40%', left: '50%',
    width: 240, height: 130,
    transform: [{ translateX: -120 }, { translateY: -65 }],
    pointerEvents: 'none',
  },
  cornerTL: { position: 'absolute', top: 0, left: 0, width: 26, height: 26, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 8 },
  cornerTR: { position: 'absolute', top: 0, right: 0, width: 26, height: 26, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 8 },
  cornerBL: { position: 'absolute', bottom: 0, left: 0, width: 26, height: 26, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 8 },
  cornerBR: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 8 },

  scanOverlayBottom: { position: 'absolute', bottom: 30, left: 0, right: 0, alignItems: 'center' },
  scanPulse: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 22,
  },
  scanInstruction: { fontSize: 14, fontWeight: '700' },

  errorText: { fontSize: 15, textAlign: 'center', marginTop: 18, paddingHorizontal: 20, fontWeight: '600', lineHeight: 22 },
  retryBtn: { paddingVertical: 14, paddingHorizontal: 30, borderRadius: 14, marginTop: 22 },
  retryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  resultContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  resultTitle: { fontSize: 22, fontWeight: '800', marginTop: 16, letterSpacing: 0.3 },
  resultCode: {
    fontSize: 13, marginTop: 8, fontFamily: 'monospace',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    borderWidth: 1, fontWeight: '700',
  },

  productCard: {
    padding: 22, borderRadius: 18, width: '100%',
    marginTop: 22, alignItems: 'center', borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 14, elevation: 4,
  },
  productIconBg: {
    width: 80, height: 80, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  productName: { fontSize: 20, fontWeight: '800', marginTop: 6, textAlign: 'center' },
  productCategory: { fontSize: 13, marginTop: 10, textAlign: 'center', fontWeight: '500', lineHeight: 19 },
  badgesRow: { flexDirection: 'row', gap: 8, marginTop: 12, justifyContent: 'center', flexWrap: 'wrap' },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '700' },

  autoProgress: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 22 },
  autoText: { fontSize: 13, fontWeight: '500' },

  skipBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    margin: 16, paddingVertical: 14, borderRadius: 14, borderWidth: 1,
  },
  skipBtnText: { fontSize: 14, fontWeight: '700' },

  manualBtn: { paddingVertical: 14, paddingHorizontal: 30, borderRadius: 14, marginTop: 22 },
  manualBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
