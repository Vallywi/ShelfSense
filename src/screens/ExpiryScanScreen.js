import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

let Tesseract = null;
if (Platform.OS === 'web') {
  Tesseract = require('tesseract.js');
}

// Try to parse expiry date from OCR text
function extractExpiryDate(text) {
  if (!text) return null;

  // Common date patterns: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD, MM-DD-YY, etc.
  const patterns = [
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/,      // MM/DD/YYYY or DD/MM/YYYY
    /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/,      // YYYY-MM-DD
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})(?!\d)/, // MM/DD/YY or DD/MM/YY
    /(\d{1,2})\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\s+(\d{2,4})/i, // DD MON YYYY
    /(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\s+(\d{1,2}),?\s+(\d{2,4})/i, // MON DD, YYYY
  ];

  const months = { JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5, JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11 };

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let date;

      // Check if month name pattern (DD MON YYYY)
      if (months[match[2]?.toUpperCase()?.substring(0, 3)] !== undefined) {
        const day = parseInt(match[1]);
        const month = months[match[2].toUpperCase().substring(0, 3)];
        let year = parseInt(match[3]);
        if (year < 100) year += 2000;
        date = new Date(year, month, day);
      }
      // Check if month name pattern (MON DD, YYYY)
      else if (months[match[1]?.toUpperCase()?.substring(0, 3)] !== undefined) {
        const month = months[match[1].toUpperCase().substring(0, 3)];
        const day = parseInt(match[2]);
        let year = parseInt(match[3]);
        if (year < 100) year += 2000;
        date = new Date(year, month, day);
      }
      // YYYY-MM-DD
      else if (match[1] && parseInt(match[1]) > 100) {
        date = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
      }
      // MM/DD/YYYY or MM/DD/YY
      else {
        let year = parseInt(match[3]);
        if (year < 100) year += 2000;
        date = new Date(year, parseInt(match[1]) - 1, parseInt(match[2]));
      }

      if (date && !isNaN(date.getTime())) {
        return date;
      }
    }
  }

  return null;
}

export default function ExpiryScanScreen({ navigation, route }) {
  const { barcode, productName, productCategory } = route.params || {};
  const [capturing, setCapturing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [detectedDate, setDetectedDate] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const startCamera = async () => {
    try {
      setCapturing(true);
      setOcrResult(null);
      setDetectedDate(null);
      setImagePreview(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;

      // Wait for DOM to be ready
      setTimeout(() => {
        const video = document.getElementById('expiry-video');
        if (video) {
          video.srcObject = stream;
          video.play();
        }
      }, 100);
    } catch (err) {
      console.error('Camera error:', err);
      setCapturing(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCapturing(false);
  };

  const captureAndProcess = async () => {
    setProcessing(true);

    try {
      const video = document.getElementById('expiry-video');
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);

      const imageData = canvas.toDataURL('image/png');
      setImagePreview(imageData);

      stopCamera();

      // Run OCR with Tesseract.js
      const result = await Tesseract.recognize(imageData, 'eng', {
        logger: (info) => {
          if (info.status === 'recognizing text') {
            // Progress update
          }
        },
      });

      const text = result.data.text;
      setOcrResult(text);

      const date = extractExpiryDate(text);
      setDetectedDate(date);
    } catch (err) {
      console.error('OCR error:', err);
      setOcrResult('Failed to read text. Please try again or enter manually.');
    }

    setProcessing(false);
  };

  const handleUseDate = () => {
    const daysUntilExpiry = Math.ceil((detectedDate - new Date()) / (1000 * 60 * 60 * 24));

    navigation.navigate('ManualAdd', {
      barcode,
      productName,
      productCategory,
      expiryDays: Math.max(1, daysUntilExpiry).toString(),
      detectedExpiryDate: detectedDate.toISOString(),
    });
  };

  const handleSkip = () => {
    navigation.navigate('ManualAdd', {
      barcode,
      productName,
      productCategory,
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="scan" size={28} color="#2ECC71" />
        <Text style={styles.headerTitle}>Scan Expiry Date</Text>
        <Text style={styles.headerSubtitle}>for {productName || 'your product'}</Text>
      </View>

      {/* Camera not started */}
      {!capturing && !processing && !ocrResult && (
        <View style={styles.centered}>
          <View style={styles.instructionCard}>
            <Ionicons name="information-circle" size={24} color="#2ECC71" />
            <Text style={styles.instructionText}>
              Point your camera at the expiry date on the product label. Make sure the date is clearly visible and well-lit.
            </Text>
          </View>
          <TouchableOpacity style={styles.startBtn} onPress={startCamera}>
            <Ionicons name="camera" size={24} color="#fff" />
            <Text style={styles.startBtnText}>  Open Camera</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Camera is live */}
      {capturing && Platform.OS === 'web' && (
        <View style={styles.cameraContainer}>
          <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', borderRadius: 12 }}>
            <video
              id="expiry-video"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              autoPlay
              playsInline
              muted
            />
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: '80%', height: 60, border: '2px solid #2ECC71', borderRadius: 8,
              pointerEvents: 'none',
            }} />
          </div>

          <TouchableOpacity style={styles.captureBtn} onPress={captureAndProcess}>
            <Ionicons name="scan-circle" size={24} color="#fff" />
            <Text style={styles.captureBtnText}>  Capture Expiry Date</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Processing */}
      {processing && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2ECC71" />
          <Text style={styles.processingText}>Reading expiry date...</Text>
          <Text style={styles.processingSubtext}>AI is analyzing the image</Text>
        </View>
      )}

      {/* OCR Result */}
      {ocrResult && !processing && (
        <View style={styles.resultArea}>
          {imagePreview && (
            <View style={styles.previewContainer}>
              <img src={imagePreview} style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 10 }} alt="captured" />
            </View>
          )}

          <View style={styles.ocrCard}>
            <Text style={styles.ocrLabel}>Detected Text:</Text>
            <Text style={styles.ocrText}>{ocrResult.substring(0, 200)}</Text>
          </View>

          {detectedDate ? (
            <View style={styles.dateFound}>
              <Ionicons name="checkmark-circle" size={30} color="#2ECC71" />
              <Text style={styles.dateFoundTitle}>Expiry Date Found!</Text>
              <Text style={styles.dateFoundValue}>{detectedDate.toLocaleDateString()}</Text>
              <TouchableOpacity style={styles.useDateBtn} onPress={handleUseDate}>
                <Text style={styles.useDateBtnText}>Use This Date</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.dateNotFound}>
              <Ionicons name="alert-circle" size={30} color="#f39c12" />
              <Text style={styles.dateNotFoundText}>Could not detect a date. You can try again or enter it manually.</Text>
            </View>
          )}

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.retryBtn} onPress={startCamera}>
              <Ionicons name="refresh" size={18} color="#2ECC71" />
              <Text style={styles.retryBtnText}>  Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Skip button */}
      <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
        <Text style={styles.skipBtnText}>Skip — Enter manually</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  header: { alignItems: 'center', marginBottom: 20, marginTop: 10 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 8 },
  headerSubtitle: { color: '#888', fontSize: 14, marginTop: 4 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  instructionCard: {
    backgroundColor: '#1E1E1E', padding: 20, borderRadius: 12,
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 30,
  },
  instructionText: { color: '#bbb', fontSize: 15, flex: 1, lineHeight: 22 },
  startBtn: {
    backgroundColor: '#2ECC71', paddingVertical: 16, paddingHorizontal: 30,
    borderRadius: 12, flexDirection: 'row', alignItems: 'center',
  },
  startBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cameraContainer: { flex: 1, borderRadius: 12, overflow: 'hidden', marginBottom: 15 },
  captureBtn: {
    backgroundColor: '#2ECC71', paddingVertical: 15, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 15,
  },
  captureBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  processingText: { color: '#fff', fontSize: 18, marginTop: 20, fontWeight: 'bold' },
  processingSubtext: { color: '#888', fontSize: 14, marginTop: 8 },
  resultArea: { flex: 1 },
  previewContainer: { marginBottom: 15, borderRadius: 10, overflow: 'hidden' },
  ocrCard: { backgroundColor: '#1E1E1E', padding: 15, borderRadius: 10, marginBottom: 15 },
  ocrLabel: { color: '#888', fontSize: 12, marginBottom: 5 },
  ocrText: { color: '#fff', fontSize: 14, fontFamily: 'monospace' },
  dateFound: { alignItems: 'center', marginBottom: 20 },
  dateFoundTitle: { color: '#2ECC71', fontSize: 18, fontWeight: 'bold', marginTop: 10 },
  dateFoundValue: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginTop: 5 },
  useDateBtn: {
    backgroundColor: '#2ECC71', paddingVertical: 12, paddingHorizontal: 30,
    borderRadius: 10, marginTop: 15,
  },
  useDateBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  dateNotFound: { alignItems: 'center', marginBottom: 20 },
  dateNotFoundText: { color: '#aaa', fontSize: 14, textAlign: 'center', marginTop: 10 },
  actionRow: { flexDirection: 'row', justifyContent: 'center', gap: 15 },
  retryBtn: {
    borderWidth: 1, borderColor: '#2ECC71', paddingVertical: 10, paddingHorizontal: 20,
    borderRadius: 10, flexDirection: 'row', alignItems: 'center',
  },
  retryBtnText: { color: '#2ECC71', fontSize: 14 },
  skipBtn: { padding: 15, alignItems: 'center' },
  skipBtnText: { color: '#f39c12', fontSize: 16, textDecorationLine: 'underline' },
});
