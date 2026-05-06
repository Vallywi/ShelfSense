import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './ThemeContext';

const ToastContext = createContext({ showToast: () => {} });
export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const timerRef = useRef(null);

  const showToast = useCallback((message, type = 'success', durationMs = 2800) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    setToast({ message, type, id: Date.now() });

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();

    timerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 20, duration: 220, useNativeDriver: true }),
      ]).start(() => setToast(null));
    }, durationMs);
  }, [opacity, translateY]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastViewport toast={toast} opacity={opacity} translateY={translateY} />
    </ToastContext.Provider>
  );
};

function ToastViewport({ toast, opacity, translateY }) {
  const { theme } = useTheme();
  if (!toast) return null;

  const config = toastConfig(toast.type, theme);

  return (
    <View pointerEvents="none" style={styles.viewport}>
      <Animated.View
        style={[
          styles.toast,
          {
            backgroundColor: config.bg,
            borderColor: config.border,
            opacity,
            transform: [{ translateY }],
            shadowColor: '#000',
          },
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: config.iconBg }]}>
          <Ionicons name={config.icon} size={16} color={config.iconColor} />
        </View>
        <Text style={[styles.text, { color: theme.text }]} numberOfLines={2}>
          {toast.message}
        </Text>
      </Animated.View>
    </View>
  );
}

function toastConfig(type, theme) {
  switch (type) {
    case 'error':
      return {
        bg: theme.card, border: theme.danger + '55',
        icon: 'alert-circle', iconBg: theme.dangerSoft, iconColor: theme.danger,
      };
    case 'info':
      return {
        bg: theme.card, border: theme.accent + '55',
        icon: 'information-circle', iconBg: theme.accentSoft, iconColor: theme.accentDeep,
      };
    case 'warning':
      return {
        bg: theme.card, border: theme.warning + '55',
        icon: 'warning', iconBg: theme.warningSoft, iconColor: theme.warning,
      };
    case 'success':
    default:
      return {
        bg: theme.card, border: theme.primary + '55',
        icon: 'checkmark-circle', iconBg: theme.primarySoft, iconColor: theme.primaryDeep,
      };
  }
}

const styles = StyleSheet.create({
  viewport: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 110 : 90,
    left: 0, right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    maxWidth: '90%',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  iconWrap: {
    width: 28, height: 28, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
  },
  text: { fontSize: 13, fontWeight: '600', flex: 1, lineHeight: 18 },
});
