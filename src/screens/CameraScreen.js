import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../config/ThemeContext';

let Html5Qrcode = null;
if (Platform.OS === 'web') {
  Html5Qrcode = require('html5-qrcode').Html5Qrcode;
}

// Map Open Food Facts categories to our app categories
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
      const name = data.product.product_name || data.product.generic_name || data.product.brands || `Product (${code})`;
      const category = mapCategory(data.product.categories);
      const imageUrl = data.product.image_front_url || data.product.image_url || null;
      const quantity = data.product.quantity || null;
      return { name, category, imageUrl, quantity };
    }
  } catch (error) {
    console.error('API lookup error:', error);
  }
  // Fallback if not found or network error
  return { 
    name: 'Product Name Not Found', 
    category: 'Others',
    isUnknown: true 
  };
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

      // Wait for DOM element to be ready
      await new Promise(resolve => setTimeout(resolve, 200));

      const scanner = new Html5Qrcode('barcode-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 15, qrbox: { width: 280, height: 150 }, aspectRatio: 1.0 },
        async (decodedText) => {
          // Auto-detected! Stop scanning immediately
          setScannedData(decodedText);
          setScanning(false);
          setAutoDetecting(true);
          stopScanner();

          // Fetch product data from Open Food Facts API
          const product = await lookupBarcodeAPI(decodedText);
          setProductInfo(product);

          // Auto-proceed after showing the product for 2 seconds
          setTimeout(() => {
            setAutoDetecting(false);
            navigation.navigate('ExpiryScan', {
              barcode: decodedText,
              productName: product.name,
              productCategory: product.category,
              productImage: product.imageUrl,
              productSize: product.quantity,
              isUnknown: product.isUnknown
            });
          }, 2500);
        },
        () => { /* scan miss — ignore */ }
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
      } catch (e) { }
      try { scannerRef.current.clear(); } catch (e) { }
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
        <Ionicons name="camera-outline" size={60} color={theme.subText} />
        <Text style={[styles.errorText, { color: theme.subText }]}>Camera scanning is available on the web/PWA version.</Text>
        <TouchableOpacity style={[styles.manualBtn, { backgroundColor: theme.card }]} onPress={() => navigation.navigate('ManualAdd')}>
          <Text style={[styles.manualBtnText, { color: theme.primary }]}>Switch to manual input</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Active Scanner */}
      {scanning && !scannedData && (
        <View style={styles.scannerArea}>
          <div id="barcode-reader" style={{ width: '100%', height: '100%' }} />
          <View style={styles.scanOverlayBottom}>
            <View style={styles.scanPulse}>
              <Ionicons name="scan" size={20} color="#2ECC71" />
              <Text style={styles.scanInstruction}>  Scanning... Point at barcode</Text>
            </View>
          </View>
        </View>
      )}

      {/* Error */}
      {error && (
        <View style={styles.centered}>
          <Ionicons name="alert-circle" size={50} color={theme.danger} />
          <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: theme.primary }]} onPress={() => { setError(null); startScanner(); }}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Auto-detected product */}
      {scannedData && (
        <View style={styles.resultContainer}>
          <Ionicons name="checkmark-circle" size={70} color={theme.safe} />
          <Text style={[styles.resultTitle, { color: theme.text }]}>Barcode Detected!</Text>
          <Text style={[styles.resultCode, { color: theme.subText }]}>{scannedData}</Text>

          {autoDetecting && !productInfo && (
            <View style={[styles.productCard, { paddingVertical: 40, backgroundColor: theme.card, borderColor: theme.border }]}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.autoText, { marginTop: 15, color: theme.subText }]}>Fetching product info...</Text>
            </View>
          )}

          {productInfo && (
            <View style={[styles.productCard, { backgroundColor: theme.card, borderColor: productInfo.isUnknown ? theme.warning : theme.border }]}>
              {productInfo.imageUrl ? (
                <img 
                  src={productInfo.imageUrl} 
                  style={{ width: 100, height: 100, objectFit: 'contain', marginBottom: 15, borderRadius: 10, backgroundColor: '#fff' }} 
                  alt="Product" 
                />
              ) : (
                <Ionicons 
                  name={productInfo.isUnknown ? "help-circle" : "cube"} 
                  size={40} 
                  color={productInfo.isUnknown ? theme.warning : theme.primary} 
                  style={{ marginBottom: 10 }}
                />
              )}
              
              <Text style={[styles.productName, { color: theme.text }]}>{productInfo.name}</Text>
              
              {!productInfo.isUnknown && (
                <View style={styles.badgesRow}>
                  <Text style={[styles.badge, { backgroundColor: theme.background, color: theme.primary }]}>{productInfo.category}</Text>
                  {productInfo.quantity && <Text style={[styles.badge, { backgroundColor: theme.background, color: theme.primary }]}>{productInfo.quantity}</Text>}
                </View>
              )}

              {productInfo.isUnknown && (
                <Text style={[styles.productCategory, { color: theme.subText, marginTop: 8 }]}>
                  Not in global database. You can enter the name on the final step.
                </Text>
              )}
            </View>
          )}

          {autoDetecting && productInfo && (
            <View style={styles.autoProgress}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={[styles.autoText, { color: theme.subText }]}>  Proceeding to expiry scanner...</Text>
            </View>
          )}
        </View>
      )}

      {/* Manual fallback */}
      <TouchableOpacity style={[styles.manualBtn, { backgroundColor: theme.card }]} onPress={handleManualSkip}>
        <Text style={[styles.manualBtnText, { color: theme.primary }]}>Skip — Enter manually instead</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  scannerArea: {
    flex: 1, position: 'relative', overflow: 'hidden',
    backgroundColor: '#000', borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
  },
  scanOverlayBottom: {
    position: 'absolute', bottom: 25, left: 0, right: 0, alignItems: 'center',
  },
  scanPulse: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25,
  },
  scanInstruction: { color: '#2ECC71', fontSize: 15, fontWeight: 'bold' },
  errorText: { fontSize: 16, textAlign: 'center', marginTop: 15, paddingHorizontal: 20 },
  retryBtn: {
    paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10, marginTop: 20,
  },
  retryBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  resultContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  resultTitle: { fontSize: 26, fontWeight: 'bold', marginTop: 15 },
  resultCode: { fontSize: 13, marginTop: 5, fontFamily: 'monospace' },
  productCard: {
    padding: 25, borderRadius: 15, width: '100%',
    marginTop: 25, alignItems: 'center', borderWidth: 1,
  },
  productName: { fontSize: 22, fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  productCategory: { fontSize: 15, marginTop: 8 },
  badgesRow: { flexDirection: 'row', gap: 10, marginTop: 12, justifyContent: 'center', flexWrap: 'wrap' },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, fontSize: 13, overflow: 'hidden' },
  autoProgress: { flexDirection: 'row', alignItems: 'center', marginTop: 25 },
  autoText: { fontSize: 14 },
  manualBtn: { padding: 18, alignItems: 'center' },
  manualBtnText: { fontSize: 16, textDecorationLine: 'underline' },
});
