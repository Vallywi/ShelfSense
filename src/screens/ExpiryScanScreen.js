import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../config/ThemeContext';

export default function ExpiryScanScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { barcode, productName, productCategory } = route.params || {};
  const [capturing, setCapturing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [detectedDate, setDetectedDate] = useState(null);
  const [confidence, setConfidence] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const streamRef = useRef(null);

  const startCamera = async () => {
    try {
      setCapturing(true);
      setOcrResult(null);
      setDetectedDate(null);
      setImagePreview(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;

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

      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const cropW = vw * 0.8;
      const cropH = vh * 0.3;
      const cropX = (vw - cropW) / 2;
      const cropY = (vh - cropH) / 2;

      canvas.width = cropW;
      canvas.height = cropH;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

      const imageData = canvas.toDataURL('image/png');
      setImagePreview(imageData);

      stopCamera();

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
      productNutrition: route.params?.productNutrition,
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
      productNutrition: route.params?.productNutrition,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: theme.primarySoft }]}>
          <Ionicons name="scan" size={26} color={theme.primaryDeep} />
        </View>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Scan Expiry Date</Text>
        <Text style={[styles.headerSubtitle, { color: theme.subText }]} numberOfLines={1}>
          for {productName || 'your product'}
        </Text>
      </View>

      {!capturing && !processing && !ocrResult && (
        <View style={styles.centered}>
          <View style={[styles.instructionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.instructionIconBg, { backgroundColor: theme.accentSoft }]}>
              <Ionicons name="information-circle" size={20} color={theme.accentDeep} />
            </View>
            <Text style={[styles.instructionText, { color: theme.subText }]}>
              Point your camera at the expiry date on the label. Make sure the date is clearly visible and well-lit.
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.startBtn, { backgroundColor: theme.primaryDeep, shadowColor: theme.primaryDeep }]}
            onPress={startCamera}
            activeOpacity={0.85}
          >
            <Ionicons name="camera" size={20} color="#FFFFFF" />
            <Text style={styles.startBtnText}>Open Camera</Text>
          </TouchableOpacity>
        </View>
      )}

      {capturing && Platform.OS === 'web' && (
        <View style={styles.cameraContainer}>
          <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', borderRadius: 16 }}>
            <video
              id="expiry-video"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              autoPlay
              playsInline
              muted
            />
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: '80%', height: 70, border: `2px solid ${theme.primary}`, borderRadius: 10,
              pointerEvents: 'none',
              boxShadow: `0 0 0 9999px rgba(0,0,0,0.5)`,
            }} />
            <div style={{
              position: 'absolute', bottom: 16, left: 16, right: 16,
              backgroundColor: 'rgba(0,0,0,0.7)', padding: '10px 14px', borderRadius: 12,
              color: theme.primary, fontWeight: 700, fontSize: 13, textAlign: 'center',
            }}>
              Align the expiry date inside the box
            </div>
          </div>

          <TouchableOpacity
            style={[styles.captureBtn, { backgroundColor: theme.primaryDeep, shadowColor: theme.primaryDeep }]}
            onPress={captureAndProcess}
            activeOpacity={0.85}
          >
            <Ionicons name="scan-circle" size={22} color="#FFFFFF" />
            <Text style={styles.captureBtnText}>Capture Expiry Date</Text>
          </TouchableOpacity>
        </View>
      )}

      {processing && (
        <View style={styles.centered}>
          <View style={[styles.processingCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <ActivityIndicator size="large" color={theme.primaryDeep} />
            <Text style={[styles.processingText, { color: theme.text }]}>Reading expiry date...</Text>
            <Text style={[styles.processingSubtext, { color: theme.subText }]}>AI is analyzing the image</Text>
          </View>
        </View>
      )}

      {ocrResult && !processing && (
        <ScrollView style={styles.resultArea} contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
          {imagePreview && (
            <View style={[styles.previewContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <img
                src={imagePreview}
                style={{ width: '100%', height: 160, objectFit: 'contain', borderRadius: 12, backgroundColor: '#000' }}
                alt="captured"
              />
            </View>
          )}

          <View style={[styles.ocrCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.ocrLabel, { color: theme.subText }]}>DETECTED TEXT</Text>
            <Text style={[styles.ocrText, { color: theme.text }]}>{ocrResult.substring(0, 200)}</Text>
          </View>

          {detectedDate ? (
            <View style={[styles.dateFound, { backgroundColor: theme.card, borderColor: theme.border, shadowOpacity: theme.shadowOpacity }]}>
              <View style={[
                styles.confidenceBadge,
                { backgroundColor: (confidence > 0.8 ? theme.safeSoft : theme.warningSoft) },
              ]}>
                <Ionicons
                  name={confidence > 0.8 ? 'shield-checkmark' : 'help-circle'}
                  size={14}
                  color={confidence > 0.8 ? theme.safe : theme.warning}
                />
                <Text style={[styles.confidenceText, { color: confidence > 0.8 ? theme.safe : theme.warning }]}>
                  {confidence > 0.8 ? 'High Confidence' : 'Check Carefully'} · {Math.round(confidence * 100)}%
                </Text>
              </View>
              <Text style={[styles.dateFoundTitle, { color: theme.subText }]}>AI DETECTED EXPIRY</Text>
              <Text style={[styles.dateFoundValue, { color: theme.primaryDeep }]}>
                {detectedDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
              <Text style={[styles.confirmationHint, { color: theme.subText }]}>Is this date correct?</Text>

              <View style={styles.primaryActionRow}>
                <TouchableOpacity
                  style={[styles.confirmBtn, { backgroundColor: theme.primaryDeep }]}
                  onPress={handleUseDate}
                  activeOpacity={0.85}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.confirmBtnText}>Yes, Confirm</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.retryBtnSmall, { borderColor: theme.primary, backgroundColor: theme.primarySoft }]}
                  onPress={startCamera}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh" size={18} color={theme.primaryDeep} />
                  <Text style={[styles.retryBtnText, { color: theme.primaryDeep }]}>Retry</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={[styles.dateNotFound, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.warningBadge, { backgroundColor: theme.warningSoft }]}>
                <Ionicons name="alert-circle" size={28} color={theme.warning} />
              </View>
              <Text style={[styles.dateNotFoundTitle, { color: theme.text }]}>Detection Failed</Text>
              <Text style={[styles.dateNotFoundText, { color: theme.subText }]}>
                AI couldn't find a clear date. Please try a clearer photo or enter it manually.
              </Text>
              <TouchableOpacity
                style={[styles.retryLargeBtn, { backgroundColor: theme.primaryDeep }]}
                onPress={startCamera}
                activeOpacity={0.85}
              >
                <Ionicons name="camera" size={18} color="#FFFFFF" />
                <Text style={styles.retryLargeBtnText}>Try Scanning Again</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.7}>
            <Text style={[styles.skipBtnText, { color: theme.subText }]}>Skip — Enter manually</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {!ocrResult && !processing && !capturing && (
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.7}>
          <Text style={[styles.skipBtnText, { color: theme.subText }]}>Skip — Enter manually</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { alignItems: 'center', marginBottom: 22, marginTop: 6 },
  headerIcon: {
    width: 56, height: 56, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  headerSubtitle: { fontSize: 13, marginTop: 4, fontWeight: '500' },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  instructionCard: {
    padding: 16, borderRadius: 16, borderWidth: 1,
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 26,
  },
  instructionIconBg: {
    width: 36, height: 36, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  instructionText: { fontSize: 14, flex: 1, lineHeight: 21, fontWeight: '500' },

  startBtn: {
    paddingVertical: 16, paddingHorizontal: 32,
    borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 8,
    elevation: 5,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  startBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  cameraContainer: { flex: 1, borderRadius: 16, overflow: 'hidden', marginBottom: 14 },
  captureBtn: {
    paddingVertical: 16, borderRadius: 14, gap: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 14,
    elevation: 5,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  captureBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  processingCard: {
    padding: 30, borderRadius: 18, borderWidth: 1,
    alignItems: 'center', minWidth: 240,
  },
  processingText: { fontSize: 16, marginTop: 18, fontWeight: '700' },
  processingSubtext: { fontSize: 13, marginTop: 6, fontWeight: '500' },

  resultArea: { flex: 1 },
  previewContainer: {
    marginBottom: 14, borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, padding: 4,
  },
  ocrCard: {
    padding: 14, borderRadius: 12, marginBottom: 16, borderWidth: 1,
  },
  ocrLabel: { fontSize: 10, marginBottom: 6, fontWeight: '700', letterSpacing: 1.2 },
  ocrText: { fontSize: 13, fontFamily: 'monospace', lineHeight: 19 },

  dateFound: {
    alignItems: 'center', marginBottom: 18, padding: 22,
    borderRadius: 18, borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 }, shadowRadius: 8, elevation: 2,
  },
  confidenceBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 12, marginBottom: 16,
  },
  confidenceText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  dateFoundTitle: { fontSize: 11, fontWeight: '700', marginBottom: 8, letterSpacing: 1.2 },
  dateFoundValue: { fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  confirmationHint: { fontSize: 13, marginBottom: 22, fontWeight: '500' },

  primaryActionRow: { flexDirection: 'row', gap: 10, width: '100%' },
  confirmBtn: {
    flex: 2, paddingVertical: 14, borderRadius: 14,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  confirmBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
  retryBtnSmall: {
    flex: 1, borderWidth: 1.5, paddingVertical: 14, borderRadius: 14,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
  },
  retryBtnText: { fontSize: 14, fontWeight: '700' },

  dateNotFound: {
    alignItems: 'center', padding: 26, borderRadius: 18, borderWidth: 1,
  },
  warningBadge: {
    width: 64, height: 64, borderRadius: 32,
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  dateNotFoundTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  dateNotFoundText: { fontSize: 14, textAlign: 'center', lineHeight: 21, marginBottom: 22, fontWeight: '500' },
  retryLargeBtn: {
    width: '100%', paddingVertical: 16, borderRadius: 14, gap: 8,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
  retryLargeBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },

  skipBtn: { padding: 14, alignItems: 'center', marginTop: 6 },
  skipBtnText: { fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
});
