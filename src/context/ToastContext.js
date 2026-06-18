import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Animated, Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { colors, radius } from '../constants/theme';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(80)).current;
  const timer = useRef(null);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 80, duration: 200, useNativeDriver: true }),
    ]).start(() => setToast(null));
  }, []);

  const showToast = useCallback((message, variant = 'info') => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ message, variant });
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
    timer.current = setTimeout(hide, 2500);
  }, [hide]);

  const borderColor = {
    success: colors.success,
    error: colors.danger,
    warning: colors.warning,
    info: colors.borderLight,
  }[toast?.variant] || colors.borderLight;

  const icon = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' }[toast?.variant] || 'ℹ';

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View style={[styles.wrap, { opacity, transform: [{ translateY }] }]}>
          <TouchableOpacity style={[styles.toast, { borderLeftColor: borderColor }]} onPress={hide} activeOpacity={0.9}>
            <Text style={styles.icon}>{icon}</Text>
            <Text style={styles.msg}>{toast.message}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return { showToast: () => {} };
  return ctx;
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, bottom: 100, zIndex: 9999 },
  toast: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, borderLeftWidth: 4, borderWidth: 1, borderColor: colors.border, gap: 10 },
  icon: { fontSize: 16, color: colors.text },
  msg: { flex: 1, color: colors.text, fontSize: 14 },
});
