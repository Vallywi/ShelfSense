import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

let Html5Qrcode = null;
if (Platform.OS === 'web') {
  Html5Qrcode = require('html5-qrcode').Html5Qrcode;
}

// Simple barcode product lookup
const BARCODE_DB = {
  '4902430928434': { name: 'Nissin Cup Noodles', category: 'Snacks' },
  '4800016124242': { name: 'Argentina Corned Beef', category: 'Canned Goods' },
  '4800361413121': { name: 'Bear Brand Milk', category: 'Dairy & Eggs' },
  '4902102141178': { name: 'Yakult', category: 'Beverages' },
  '4800092130816': { name: 'Lucky Me Pancit Canton', category: 'Grains & Rice' },
  '036000291452': { name: 'Bounty Paper Towels', category: 'Others' },
  '049000042566': { name: 'Coca Cola', category: 'Beverages' },
};

function lookupBarcode(code) {
  if (BARCODE_DB[code]) return BARCODE_DB[code];
  return { name: `Scanned Product (${code})`, category: 'Others' };
}

export default function CameraScreen({ navigation }) {
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (Platform.OS === 'web' && Html5Qrcode) {
      startScanner();
    }

    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    try {
      setError(null);
      setScanning(true);
      setScannedData(null);

      const scanner = new Html5Qrcode('barcode-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 280, height: 150 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Barcode detected!
          setScannedData(decodedText);
          setScanning(false);
          stopScanner();
        },
        () => {
          // Scan miss — ignore
        }
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
        if (state === 2) { // SCANNING state
          await scannerRef.current.stop();
        }
      } catch (e) {
        // Ignore stop errors
      }
      try {
        scannerRef.current.clear();
      } catch (e) {
        // Ignore clear errors
      }
      scannerRef.current = null;
    }
  };

  const handleUseScan = () => {
    const product = lookupBarcode(scannedData);
    // Navigate to Expiry Scan screen with the barcode data
    navigation.navigate('ExpiryScan', {
      barcode: scannedData,
      productName: product.name,
      productCategory: product.category,
    });
  };

  const handleRescan = async () => {
    setScannedData(null);
    setError(null);
    startScanner();
  };

  if (Platform.OS !== 'web') {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="camera-outline" size={60} color="#555" />
        <Text style={styles.errorText}>Camera scanning is available on the web version.</Text>
        <TouchableOpacity style={styles.manualBtn} onPress={() => navigation.navigate('ManualAdd')}>
          <Text style={styles.manualBtnText}>Switch to manual input</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Scanner viewport */}
      {!scannedData && (
        <View style={styles.scannerArea}>
          <div id="barcode-reader" style={{ width: '100%', height: '100%' }} />
          {scanning && (
            <View style={styles.scanOverlay}>
              <Text style={styles.scanInstruction}>Point camera at a barcode</Text>
            </View>
          )}
        </View>
      )}

      {/* Error state */}
      {error && (
        <View style={styles.centered}>
          <Ionicons name="alert-circle" size={50} color="#e74c3c" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleRescan}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Scanned result */}
      {scannedData && (
        <View style={styles.resultContainer}>
          <Ionicons name="checkmark-circle" size={60} color="#2ECC71" />
          <Text style={styles.resultTitle}>Barcode Detected!</Text>
          <Text style={styles.resultCode}>{scannedData}</Text>

          <View style={styles.productCard}>
            <Text style={styles.productName}>{lookupBarcode(scannedData).name}</Text>
            <Text style={styles.productCategory}>{lookupBarcode(scannedData).category}</Text>
          </View>

          <TouchableOpacity style={styles.useBtn} onPress={handleUseScan}>
            <Ionicons name="camera" size={20} color="#fff" />
            <Text style={styles.useBtnText}>  Next: Scan Expiry Date</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.rescanBtn} onPress={handleRescan}>
            <Text style={styles.rescanBtnText}>Scan Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Manual fallback */}
      <TouchableOpacity
        style={styles.manualBtn}
        onPress={() => navigation.navigate('ManualAdd')}
      >
        <Text style={styles.manualBtnText}>Switch to manual input</Text>
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
  scanOverlay: {
    position: 'absolute', bottom: 30, left: 0, right: 0, alignItems: 'center',
  },
  scanInstruction: {
    color: '#fff', fontSize: 16, fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20,
  },
  errorText: { color: '#aaa', fontSize: 16, textAlign: 'center', marginTop: 15, paddingHorizontal: 20 },
  retryBtn: {
    backgroundColor: '#2ECC71', paddingVertical: 12, paddingHorizontal: 30,
    borderRadius: 10, marginTop: 20,
  },
  retryBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  resultContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  resultTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 15 },
  resultCode: { color: '#888', fontSize: 14, marginTop: 5, fontFamily: 'monospace' },
  productCard: {
    backgroundColor: '#1E1E1E', padding: 20, borderRadius: 12, width: '100%',
    marginTop: 20, alignItems: 'center',
  },
  productName: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  productCategory: { color: '#2ECC71', fontSize: 14, marginTop: 5 },
  useBtn: {
    backgroundColor: '#2ECC71', paddingVertical: 15, paddingHorizontal: 30,
    borderRadius: 12, marginTop: 25, flexDirection: 'row', alignItems: 'center',
    width: '100%', justifyContent: 'center',
  },
  useBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  rescanBtn: { marginTop: 15 },
  rescanBtnText: { color: '#2ECC71', fontSize: 16, textDecorationLine: 'underline' },
  manualBtn: { padding: 15, alignItems: 'center' },
  manualBtnText: { color: '#2ECC71', fontSize: 16, textDecorationLine: 'underline' },
});
