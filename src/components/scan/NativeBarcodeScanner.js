import { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { radius } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { getOffProductByBarcode, normalizeScannedBarcode } from '../../services/food/providers/openFoodFacts';

export default function NativeBarcodeScanner({ onProductFound, onNotFound, onClose, onSearchManual }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [looking, setLooking] = useState(false);
  const scanY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanY, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(scanY, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  }, [scanY]);

  const handleScan = async ({ data }) => {
    if (scanned) return;
    const code = normalizeScannedBarcode(data);
    if (!code || code.length < 8) return;
    setScanned(true);
    setLooking(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const product = await getOffProductByBarcode(code);
      if (product) onProductFound?.(product);
      else onNotFound?.(code);
    } catch {
      onNotFound?.(code);
    } finally {
      setLooking(false);
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.perm}>
        <Text style={styles.permIcon}>📷</Text>
        <Text style={styles.permTitle}>Camera Access Needed</Text>
        <Text style={styles.permSub}>Foodprint needs camera access to scan barcodes.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Enable Camera Access</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onSearchManual}><Text style={styles.link}>Search Manually Instead</Text></TouchableOpacity>
      </View>
    );
  }

  const lineStyle = { transform: [{ translateY: scanY.interpolate({ inputRange: [0, 1], outputRange: [0, 200] }) }] };

  return (
    <View style={styles.wrap}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleScan}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr', 'itf14'] }}
      />
      <View style={styles.overlay}>
        <View style={styles.dimTop} />
        <View style={styles.midRow}>
          <View style={styles.dimSide} />
          <View style={styles.frame}>
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <Animated.View style={[styles.scanLine, lineStyle]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
          </View>
          <View style={styles.dimSide} />
        </View>
        <View style={styles.dimBottom}>
          <Text style={styles.hint}>Point camera at a barcode</Text>
          {looking && <Text style={styles.found}>Found! Looking up product...</Text>}
        </View>
      </View>
      <TouchableOpacity style={styles.close} onPress={onClose}><Text style={styles.closeText}>✕ Close</Text></TouchableOpacity>
      {scanned && !looking && (
        <TouchableOpacity style={styles.rescan} onPress={() => setScanned(false)}>
          <Text style={styles.rescanText}>Scan Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#000' },
  overlay: { ...StyleSheet.absoluteFillObject },
  dimTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  midRow: { flexDirection: 'row', height: 220 },
  dimSide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  frame: { width: 220, height: 220, position: 'relative' },
  scanLine: { position: 'absolute', left: 8, right: 8, height: 2, backgroundColor: colors.accent, top: 10 },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: colors.accent },
  tl: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  tr: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  br: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  dimBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', paddingTop: 20 },
  hint: { color: '#fff', fontSize: 15 },
  found: { color: colors.accent, marginTop: 8 },
  close: { position: 'absolute', top: 48, right: 16, padding: 10 },
  closeText: { color: '#fff', fontWeight: '700' },
  rescan: { position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: colors.accent, paddingHorizontal: 20, paddingVertical: 12, borderRadius: radius.sm },
  rescanText: { color: colors.onAccent, fontWeight: '700' },
  perm: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.bg },
  permIcon: { fontSize: 48, marginBottom: 16 },
  permTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  permSub: { color: colors.textMuted, textAlign: 'center', marginVertical: 12 },
  permBtn: { backgroundColor: colors.accent, paddingHorizontal: 20, paddingVertical: 12, borderRadius: radius.sm, marginBottom: 12 },
  permBtnText: { color: colors.onAccent, fontWeight: '700' },
  link: { color: colors.accent },
});
