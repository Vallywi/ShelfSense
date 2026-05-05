import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
      return { name, category };
    }
  } catch (error) {
    console.error('API lookup error:', error);
  }
  // Fallback if not found or network error
  return { name: `Unknown Product (${code})`, category: 'Others' };
}

export default function CameraScreen({ navigation }) {
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
            });
          }, 2000);
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
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="camera-outline" size={60} color="#555" />
        <Text style={styles.errorText}>Camera scanning is available on the web/PWA version.</Text>
        <TouchableOpacity style={styles.manualBtn} onPress={() => navigation.navigate('ManualAdd')}>
          <Text style={styles.manualBtnText}>Switch to manual input</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
          <Ionicons name="alert-circle" size={50} color="#e74c3c" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setError(null); startScanner(); }}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Auto-detected product */}
      {scannedData && (
        <View style={styles.resultContainer}>
          <Ionicons name="checkmark-circle" size={70} color="#2ECC71" />
          <Text style={styles.resultTitle}>Barcode Detected!</Text>
          <Text style={styles.resultCode}>{scannedData}</Text>

          {autoDetecting && !productInfo && (
            <View style={[styles.productCard, { paddingVertical: 40 }]}>
              <ActivityIndicator size="large" color="#2ECC71" />
              <Text style={[styles.autoText, { marginTop: 15 }]}>Fetching product info...</Text>
            </View>
          )}

          {productInfo && (
            <View style={styles.productCard}>
              <Ionicons name="cube" size={30} color="#2ECC71" />
              <Text style={styles.productName}>{productInfo.name}</Text>
              <Text style={styles.productCategory}>{productInfo.category}</Text>
            </View>
          )}

          {autoDetecting && productInfo && (
            <View style={styles.autoProgress}>
              <ActivityIndicator size="small" color="#2ECC71" />
              <Text style={styles.autoText}>  Opening expiry date scanner...</Text>
            </View>
          )}
        </View>
      )}

      {/* Manual fallback */}
      <TouchableOpacity style={styles.manualBtn} onPress={handleManualSkip}>
        <Text style={styles.manualBtnText}>Skip — Enter manually instead</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
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
  errorText: { color: '#aaa', fontSize: 16, textAlign: 'center', marginTop: 15, paddingHorizontal: 20 },
  retryBtn: {
    backgroundColor: '#2ECC71', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10, marginTop: 20,
  },
  retryBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  resultContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  resultTitle: { color: '#fff', fontSize: 26, fontWeight: 'bold', marginTop: 15 },
  resultCode: { color: '#666', fontSize: 13, marginTop: 5, fontFamily: 'monospace' },
  productCard: {
    backgroundColor: '#1E1E1E', padding: 25, borderRadius: 15, width: '100%',
    marginTop: 25, alignItems: 'center', borderWidth: 1, borderColor: '#2ECC7133',
  },
  productName: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  productCategory: { color: '#2ECC71', fontSize: 15, marginTop: 8 },
  autoProgress: { flexDirection: 'row', alignItems: 'center', marginTop: 25 },
  autoText: { color: '#888', fontSize: 14 },
  manualBtn: { padding: 18, alignItems: 'center', backgroundColor: '#1a1a1a' },
  manualBtnText: { color: '#2ECC71', fontSize: 16, textDecorationLine: 'underline' },
});
