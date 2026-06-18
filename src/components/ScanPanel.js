import { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, Alert, Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { radius } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { analyzeFoodImage, extractBarcodeFromImage, isOpenAIConfigured } from '../services/openai';
import { uriToBase64, mimeFromUri } from '../utils/image';
import { searchFoods } from '../services/food/searchFoods';
import { Button } from './ui/Button';
import AnalyzingSkeleton from './scan/AnalyzingSkeleton';
import PaywallOverlay from './paywall/PaywallOverlay';
import { useUser } from '../context/UserContext';

export default function ScanPanel({ onFoodDetected, onBarcodeFound, onAiFoodReady }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { isPro } = useUser();
  const [aiPaywall, setAiPaywall] = useState(false);
  const [mode, setMode] = useState(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [liveScan, setLiveScan] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      await processImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      await processImage(result.assets[0].uri);
    }
  };

  const processImage = async (uri) => {
    setPreview(uri);
    setLoading(true);
    try {
      const base64 = await uriToBase64(uri);
      const mime = mimeFromUri(uri);

      if (mode === 'ai') {
        const result = await analyzeFoodImage(uri, base64, mime);
        const foods = result.foods || [];
        onFoodDetected?.(foods);
        if (foods[0]) {
          onAiFoodReady?.({ ...foods[0], id: `ai-scan-${Date.now()}` }, uri);
        }
      } else if (mode === 'barcode') {
        const barcode = await extractBarcodeFromImage(uri, base64, mime);
        if (barcode) {
          const foods = await searchFoods(barcode);
          if (foods.length) onBarcodeFound?.(foods);
          else Alert.alert('Barcode found', `Code: ${barcode}\nNo exact match — try searching manually.`);
        } else {
          Alert.alert('No barcode detected', 'Try a clearer photo of the barcode or use live scanner.');
        }
      }
    } catch (e) {
      Alert.alert('Scan failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLiveBarcode = ({ data }) => {
    if (scanned || mode !== 'barcode') return;
    setScanned(true);
    searchFoods(data).then((foods) => {
      if (foods.length) onBarcodeFound?.(foods);
      else Alert.alert('Barcode scanned', `Code: ${data}`);
    }).finally(() => setTimeout(() => setScanned(false), 2000));
  };

  if (!mode) {
    return (
      <View style={styles.options}>
        <TouchableOpacity style={styles.optionCard} onPress={() => setMode('barcode')}>
          <View style={styles.iconWrap}>
            <Feather name="maximize" size={22} color={colors.accent} />
          </View>
          <Text style={styles.optionTitle}>Barcode Scanner</Text>
          <Text style={styles.optionDesc}>Scan product barcodes from packaging photos or live camera</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionCard} onPress={() => { if (!isPro) { setAiPaywall(true); return; } setMode('ai'); }}>
          <View style={[styles.iconWrap, styles.iconWrapAi]}>
            <Feather name="aperture" size={22} color={colors.info} />
          </View>
          <Text style={styles.optionTitle}>AI Food Scanner</Text>
          <Text style={styles.optionDesc}>
            Snap or upload a meal photo for instant nutrition estimates
            {!isOpenAIConfigured() ? ' (demo mode without API key)' : ''}
          </Text>
        </TouchableOpacity>
        <PaywallOverlay visible={aiPaywall} featureName="AI Photo Scanner" benefit="Snap any meal for instant nutrition analysis" onDismiss={() => setAiPaywall(false)} />
      </View>
    );
  }

  return (
    <View>
      <TouchableOpacity style={styles.back} onPress={() => { setMode(null); setPreview(null); setLiveScan(false); }}>
        <Feather name="arrow-left" size={18} color={colors.textSecondary} />
        <Text style={styles.backText}>Back to scan options</Text>
      </TouchableOpacity>

      <Text style={styles.modeTitle}>{mode === 'barcode' ? 'Barcode Scanner' : 'AI Food Scanner'}</Text>
      <Text style={styles.modeDesc}>
        {mode === 'barcode'
          ? 'Photograph the barcode or use live scanning'
          : 'Photograph or upload your meal for automatic nutrition estimation'}
      </Text>

      {!loading && (
        <View style={styles.actions}>
          <Button title="Take Photo" onPress={takePhoto} variant="outline" style={styles.actionBtn} />
          <Button title="Upload Image" onPress={pickImage} variant="outline" style={styles.actionBtn} />
        </View>
      )}

      {mode === 'barcode' && Platform.OS !== 'web' && !loading && (
        <>
          <Button
            title={liveScan ? 'Stop Live Scanner' : 'Open Live Scanner'}
            onPress={async () => {
              if (!permission?.granted) await requestPermission();
              setLiveScan(!liveScan);
            }}
            style={{ marginBottom: 12 }}
          />
          {liveScan && permission?.granted && (
            <View style={styles.cameraWrap}>
              <CameraView
                style={styles.camera}
                barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
                onBarcodeScanned={scanned ? undefined : handleLiveBarcode}
              />
            </View>
          )}
        </>
      )}

      {loading && mode === 'ai' ? (
        <AnalyzingSkeleton imageUri={preview} />
      ) : loading ? (
        <AnalyzingSkeleton imageUri={preview} />
      ) : null}

      {preview && !loading && mode === 'barcode' && (
        <Image source={{ uri: preview }} style={styles.preview} resizeMode="cover" />
      )}
      <PaywallOverlay visible={aiPaywall} featureName="AI Photo Scanner" benefit="Snap any meal for instant nutrition analysis" onDismiss={() => setAiPaywall(false)} />
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  options: { gap: 12 },
  optionCard: {
    backgroundColor: colors.surface2,
    borderRadius: radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 120,
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: colors.accentMuted,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  iconWrapAi: { backgroundColor: 'rgba(103, 232, 249, 0.12)' },
  optionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 6 },
  optionDesc: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, minHeight: 44 },
  backText: { color: colors.textSecondary, fontSize: 14 },
  modeTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 4 },
  modeDesc: { fontSize: 13, color: colors.textMuted, marginBottom: 16, lineHeight: 19 },
  actions: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  actionBtn: { flex: 1, minHeight: 48 },
  cameraWrap: { borderRadius: radius.md, overflow: 'hidden', height: 220, marginBottom: 12 },
  camera: { flex: 1 },
  preview: { width: '100%', height: 200, borderRadius: radius.md, marginTop: 8 },
});
