import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../config/ThemeContext';
import { useTour } from '../config/TourContext';

const SCREEN = Dimensions.get('window');
const PADDING = 8;
const MEASURE_RETRIES = 8;
const MEASURE_DELAY_MS = 120;

export default function TourOverlay() {
  const { theme } = useTheme();
  const tour = useTour();
  const [layout, setLayout] = useState(null); // { x, y, width, height } of target
  const pulse = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  // Pulsing border around the spotlight
  useEffect(() => {
    if (!tour?.isActive) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [tour?.isActive, pulse]);

  // Fade-in tooltip when a step starts
  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [tour?.currentIndex, fade]);

  // Measure the active target with retries (in case it just mounted from a tab switch)
  useEffect(() => {
    if (!tour?.isActive || !tour.currentStep) return;
    setLayout(null);
    let cancelled = false;

    const tryMeasure = (attempts) => {
      if (cancelled) return;
      const ref = tour.getTargetRef(tour.currentStep.targetId);
      const node = ref?.current;

      if (node && typeof node.measureInWindow === 'function') {
        node.measureInWindow((x, y, width, height) => {
          if (cancelled) return;
          if (width > 0 && height > 0) {
            setLayout({ x, y, width, height });
          } else if (attempts > 0) {
            setTimeout(() => tryMeasure(attempts - 1), MEASURE_DELAY_MS);
          }
        });
      } else if (attempts > 0) {
        setTimeout(() => tryMeasure(attempts - 1), MEASURE_DELAY_MS);
      }
    };

    // Small initial delay so tab switches can settle
    setTimeout(() => tryMeasure(MEASURE_RETRIES), 250);
    return () => { cancelled = true; };
  }, [tour?.isActive, tour?.currentIndex, tour?.currentStep]);

  if (!tour || !tour.isActive || !tour.currentStep) return null;

  const step = tour.currentStep;
  const { width: SW, height: SH } = SCREEN;

  // Highlight box position with padding
  const hx = layout ? Math.max(0, layout.x - PADDING) : 0;
  const hy = layout ? Math.max(0, layout.y - PADDING) : 0;
  const hw = layout ? layout.width + PADDING * 2 : 0;
  const hh = layout ? layout.height + PADDING * 2 : 0;

  // Tooltip placement
  const tooltipMargin = 14;
  const tooltipMaxWidth = Math.min(SW - 32, 360);
  const placementBelow = step.placement !== 'top';
  const tooltipTop = layout
    ? (placementBelow ? hy + hh + tooltipMargin : null)
    : SH / 2;
  const tooltipBottom = layout && !placementBelow
    ? SH - hy + tooltipMargin
    : null;

  const stepNum = tour.currentIndex + 1;
  const isLast = stepNum === tour.totalSteps;

  return (
    <View style={styles.root} pointerEvents="box-none">
      {/* Four dim rectangles around the spotlight */}
      {layout ? (
        <>
          <View style={[styles.dim, { left: 0, top: 0, width: SW, height: hy }]} />
          <View style={[styles.dim, { left: 0, top: hy + hh, width: SW, height: SH - (hy + hh) }]} />
          <View style={[styles.dim, { left: 0, top: hy, width: hx, height: hh }]} />
          <View style={[styles.dim, { left: hx + hw, top: hy, width: SW - (hx + hw), height: hh }]} />

          {/* Pulsing border around the highlighted element */}
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: hx, top: hy, width: hw, height: hh,
              borderRadius: 16,
              borderWidth: 3,
              borderColor: theme.primary,
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
              transform: [{
                scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }),
              }],
            }}
          />
        </>
      ) : (
        // Full dim while we wait for the target to be measurable
        <View style={[styles.dim, StyleSheet.absoluteFillObject]} />
      )}

      {/* Skip + step counter pinned top-right */}
      <Animated.View
        style={[styles.topBar, { opacity: fade, paddingTop: Platform.OS === 'ios' ? 50 : 18 }]}
        pointerEvents="box-none"
      >
        <View style={[styles.stepCounter, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
          <Text style={styles.stepCounterText}>{stepNum} of {tour.totalSteps}</Text>
        </View>
        <TouchableOpacity
          onPress={tour.skip}
          style={[styles.skipBtn, { backgroundColor: 'rgba(0,0,0,0.55)' }]}
          activeOpacity={0.8}
        >
          <Text style={styles.skipBtnText}>Skip Tour</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Tooltip card */}
      <Animated.View
        style={[
          styles.tooltip,
          {
            backgroundColor: theme.card,
            borderColor: theme.primary,
            top: tooltipTop,
            bottom: tooltipBottom,
            maxWidth: tooltipMaxWidth,
            opacity: fade,
            transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
            shadowColor: '#000',
          },
        ]}
        pointerEvents="auto"
      >
        <View style={styles.tooltipHeader}>
          <View style={[styles.tooltipBadge, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="sparkles" size={14} color={theme.primaryDeep} />
          </View>
          <Text style={[styles.tooltipTitle, { color: theme.text }]}>{step.title}</Text>
        </View>
        <Text style={[styles.tooltipBody, { color: theme.subText }]}>{step.body}</Text>

        <View style={styles.tooltipActions}>
          {tour.currentIndex > 0 && (
            <TouchableOpacity
              onPress={tour.back}
              style={[styles.btnSecondary, { backgroundColor: theme.surface, borderColor: theme.border }]}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={14} color={theme.text} />
              <Text style={[styles.btnSecondaryText, { color: theme.text }]}>Back</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            onPress={tour.advance}
            style={[styles.btnPrimary, { backgroundColor: theme.primaryDeep }]}
            activeOpacity={0.85}
          >
            <Text style={styles.btnPrimaryText}>{isLast ? 'Done' : 'Next'}</Text>
            {!isLast && <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />}
            {isLast && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
          </TouchableOpacity>
        </View>

        {/* Progress dots */}
        <View style={styles.dotsRow}>
          {tour.steps.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === tour.currentIndex
                    ? theme.primaryDeep
                    : i < tour.currentIndex
                      ? theme.primary
                      : theme.border,
                  width: i === tour.currentIndex ? 18 : 6,
                },
              ]}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, zIndex: 9998 },
  dim: { position: 'absolute', backgroundColor: 'rgba(10, 25, 18, 0.72)' },

  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
  },
  stepCounter: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  stepCounterText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  skipBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12 },
  skipBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  tooltip: {
    position: 'absolute', alignSelf: 'center',
    marginHorizontal: 16,
    padding: 16, borderRadius: 18, borderWidth: 1.5,
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 10,
    width: '90%',
    left: '5%',
  },
  tooltipHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  tooltipBadge: {
    width: 28, height: 28, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  tooltipTitle: { fontSize: 16, fontWeight: '800', flex: 1, letterSpacing: 0.3 },
  tooltipBody: { fontSize: 13, lineHeight: 19, fontWeight: '500' },

  tooltipActions: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14,
  },
  btnSecondary: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1,
  },
  btnSecondaryText: { fontSize: 13, fontWeight: '700' },
  btnPrimary: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10,
  },
  btnPrimaryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },

  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 14 },
  dot: { height: 6, borderRadius: 3 },
});
