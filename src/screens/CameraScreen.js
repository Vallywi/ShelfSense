import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CameraScreen({ navigation }) {
  // Note: Camera/barcode scanning requires a physical device.
  // In Expo Go, we show a simulated scanner UI with manual fallback.

  const handleSimulatedScan = () => {
    // Simulate a barcode scan for demo purposes
    navigation.navigate('ManualAdd', { barcode: '4901234567890' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.cameraPlaceholder}>
        <View style={styles.scanBox}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        <Ionicons name="scan-outline" size={80} color="#2ECC71" style={{ marginBottom: 20 }} />
        <Text style={styles.instruction}>Point camera at a barcode</Text>
        <Text style={styles.subInstruction}>Camera scanning works on physical devices</Text>
      </View>

      <TouchableOpacity style={styles.scanButton} onPress={handleSimulatedScan}>
        <Ionicons name="barcode-outline" size={24} color="#fff" />
        <Text style={styles.scanButtonText}>  Simulate Scan</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.manualButton} 
        onPress={() => navigation.navigate('ManualAdd')}
      >
        <Text style={styles.manualButtonText}>Switch to manual input</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center', padding: 20 },
  cameraPlaceholder: { 
    flex: 1, justifyContent: 'center', alignItems: 'center', 
    backgroundColor: '#1a1a1a', width: '100%', borderRadius: 20, 
    marginVertical: 20, position: 'relative'
  },
  scanBox: { 
    width: 220, height: 150, position: 'absolute',
    borderWidth: 0, borderColor: 'transparent'
  },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: '#2ECC71' },
  topLeft: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  topRight: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  instruction: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 20 },
  subInstruction: { color: '#888', fontSize: 14, marginTop: 8 },
  scanButton: { 
    backgroundColor: '#2ECC71', paddingVertical: 15, paddingHorizontal: 30, 
    borderRadius: 10, flexDirection: 'row', alignItems: 'center', marginBottom: 15, width: '100%', justifyContent: 'center'
  },
  scanButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  manualButton: { marginBottom: 30 },
  manualButtonText: { color: '#2ECC71', fontSize: 16, textDecorationLine: 'underline' }
});
