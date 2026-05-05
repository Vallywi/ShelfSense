import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../config/ThemeContext';

// Tesseract is removed in favor of AI Vision API

import { parseExpiryDate } from '../services/ai';

export default function ExpiryScanScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { barcode, productName, productCategory } = route.params || {};
  const [capturing, setCapturing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [detectedDate, setDetectedDate] = useState(null);
  const [confidence, setConfidence] = useState(null);
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
      
      // Calculate the crop area (the center rectangle)
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      
      // We estimate the bounding box. The UI box is 80% width, ~60px height.
      // We'll crop 80% width and 30% height from the center to ensure we get the text
      const cropW = vw * 0.8;
      const cropH = vh * 0.3; 
      const cropX = (vw - cropW) / 2;
      const cropY = (vh - cropH) / 2;

      canvas.width = cropW;
      canvas.height = cropH;
      const ctx = canvas.getContext('2d');
      
      // Draw only the cropped section
      ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

      // No preprocessing needed for AI Vision - it works best with raw color
      const imageData = canvas.toDataURL('image/png');
      setImagePreview(imageData);

      stopCamera();

      // Run AI Vision Detection
      const response = await fetch('/api/detect-expiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData }),
      });

      if (!response.ok) throw new Error('AI Vision request failed');
      
      const result = await response.json();
      
      setOcrResult(result.raw_text);
      setConfidence(result.confidence);

      if (result.date) {
        const dateObj = new Date(result.date);
        if (!isNaN(dateObj.getTime())) {
          setDetectedDate(dateObj);
        } else {
          setDetectedDate(null);
        }
      } else {
        setDetectedDate(null);
      }

    } catch (err) {
      console.error('AI Vision error:', err);
      setOcrResult('AI failed to process image. Please try again or enter manually.');
    }

    setProcessing(false);
  };

  const handleUseDate = () => {
    const daysUntilExpiry = Math.ceil((detectedDate - new Date()) / (1000 * 60 * 60 * 24));

    navigation.navigate('ManualAdd', {
      barcode,
      productName,
      productCategory,
      productImage: route.params?.productImage,
      productSize: route.params?.productSize,
      expiryDays: Math.max(1, daysUntilExpiry).toString(),
      detectedExpiryDate: detectedDate.toISOString(),
    });
  };

  const handleSkip = () => {
    navigation.navigate('ManualAdd', {
      barcode,
      productName,
      productCategory,
      productImage: route.params?.productImage,
      productSize: route.params?.productSize,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="scan" size={28} color={theme.primary} />
        <Text style={[styles.headerTitle, { color: theme.text }]}>Scan Expiry Date</Text>
        <Text style={[styles.headerSubtitle, { color: theme.subText }]}>for {productName || 'your product'}</Text>
      </View>

      {/* Camera not started */}
      {!capturing && !processing && !ocrResult && (
        <View style={styles.centered}>
          <View style={[styles.instructionCard, { backgroundColor: theme.card }]}>
            <Ionicons name="information-circle" size={24} color={theme.primary} />
            <Text style={[styles.instructionText, { color: theme.subText }]}>
              Point your camera at the expiry date on the product label. Make sure the date is clearly visible and well-lit.
            </Text>
          </View>
          <TouchableOpacity style={[styles.startBtn, { backgroundColor: theme.primary }]} onPress={startCamera}>
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
              width: '80%', height: 60, border: `2px solid ${theme.primary}`, borderRadius: 8,
              pointerEvents: 'none',
            }} />
          </div>

          <TouchableOpacity style={[styles.captureBtn, { backgroundColor: theme.primary }]} onPress={captureAndProcess}>
            <Ionicons name="scan-circle" size={24} color="#fff" />
            <Text style={styles.captureBtnText}>  Capture Expiry Date</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Processing */}
      {processing && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.processingText, { color: theme.text }]}>Reading expiry date...</Text>
          <Text style={[styles.processingSubtext, { color: theme.subText }]}>AI is analyzing the image</Text>
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

          <View style={[styles.ocrCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.ocrLabel, { color: theme.subText }]}>Detected Text:</Text>
            <Text style={[styles.ocrText, { color: theme.text }]}>{ocrResult.substring(0, 200)}</Text>
          </View>

          {detectedDate ? (
            <View style={styles.dateFound}>
              <View style={[styles.confidenceBadge, { backgroundColor: (confidence > 0.8 ? theme.safe : theme.warning) + '22' }]}>
                <Ionicons name={confidence > 0.8 ? "shield-checkmark" : "help-circle"} size={16} color={confidence > 0.8 ? theme.safe : theme.warning} />
                <Text style={[styles.confidenceText, { color: confidence > 0.8 ? theme.safe : theme.warning }]}>
                  {confidence > 0.8 ? 'High Confidence' : 'Check Carefully'} ({Math.round(confidence * 100)}%)
                </Text>
              </View>
              <Text style={[styles.dateFoundTitle, { color: theme.text }]}>AI Detected Expiry:</Text>
              <Text style={[styles.dateFoundValue, { color: theme.primary }]}>
                {detectedDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
              <Text style={[styles.confirmationHint, { color: theme.subText }]}>Is this date correct?</Text>
              
              <View style={styles.primaryActionRow}>
                <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: theme.primary }]} onPress={handleUseDate}>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.confirmBtnText}>Yes, Confirm</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.retryBtn, { borderColor: theme.primary }]} onPress={startCamera}>
                  <Ionicons name="refresh" size={20} color={theme.primary} />
                  <Text style={[styles.retryBtnText, { color: theme.primary }]}>No, Retry</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.dateNotFound}>
              <View style={[styles.warningBadge, { backgroundColor: theme.warning + '22' }]}>
                <Ionicons name="alert-circle" size={22} color={theme.warning} />
              </View>
              <Text style={[styles.dateNotFoundTitle, { color: theme.text }]}>Detection Failed</Text>
              <Text style={[styles.dateNotFoundText, { color: theme.subText }]}>
                AI couldn't find a clear date in the scanned text.
              </Text>
              <TouchableOpacity style={[styles.retryLargeBtn, { backgroundColor: theme.primary }]} onPress={startCamera}>
                <Ionicons name="camera" size={20} color="#fff" />
                <Text style={styles.retryLargeBtnText}>Try Scanning Again</Text>
              </TouchableOpacity>
            </View>
          )}


        </View>
      )}

      {/* Skip button */}
      <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
        <Text style={[styles.skipBtnText, { color: theme.warning }]}>Skip — Enter manually</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { alignItems: 'center', marginBottom: 20, marginTop: 10 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', marginTop: 8 },
  headerSubtitle: { fontSize: 14, marginTop: 4 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  instructionCard: {
    padding: 20, borderRadius: 12,
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 30,
  },
  instructionText: { fontSize: 15, flex: 1, lineHeight: 22 },
  startBtn: {
    paddingVertical: 16, paddingHorizontal: 30,
    borderRadius: 12, flexDirection: 'row', alignItems: 'center',
  },
  startBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cameraContainer: { flex: 1, borderRadius: 12, overflow: 'hidden', marginBottom: 15 },
  captureBtn: {
    paddingVertical: 15, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 15,
  },
  captureBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  processingText: { fontSize: 18, marginTop: 20, fontWeight: 'bold' },
  processingSubtext: { fontSize: 14, marginTop: 8 },
  resultArea: { flex: 1 },
  previewContainer: { marginBottom: 15, borderRadius: 10, overflow: 'hidden' },
  ocrCard: { padding: 15, borderRadius: 10, marginBottom: 15 },
  ocrLabel: { fontSize: 12, marginBottom: 5 },
  ocrText: { fontSize: 14, fontFamily: 'monospace' },
  dateFound: { alignItems: 'center', marginBottom: 20, padding: 20, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.03)' },
  confidenceBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 15 },
  confidenceText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  dateFoundTitle: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  dateFoundValue: { fontSize: 32, fontWeight: '900', textAlign: 'center', marginBottom: 10 },
  confirmationHint: { fontSize: 13, marginBottom: 25 },
  primaryActionRow: { flexDirection: 'row', gap: 12, width: '100%' },
  confirmBtn: { flex: 2, paddingVertical: 16, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  retryBtn: { flex: 1, borderWidth: 1.5, paddingVertical: 16, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  retryBtnText: { fontSize: 15, fontWeight: '700' },
  
  dateNotFound: { alignItems: 'center', padding: 30 },
  warningBadge: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  dateNotFoundTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  dateNotFoundText: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 25 },
  retryLargeBtn: { width: '100%', paddingVertical: 18, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  retryLargeBtnText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  
  skipBtn: { padding: 15, alignItems: 'center', marginTop: 10 },
  skipBtnText: { fontSize: 16, fontWeight: '600' },
});
