import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { uriToBase64, mimeFromUri } from '../../utils/image';

const BG = '#0A0A0A';
const ACCENT = '#AAFF00';
const SURFACE = '#141414';

const API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '';
const MODEL = 'claude-opus-4-5';

const CONFIDENCE_STYLES = {
  high: { label: 'High', color: '#22C55E', bg: 'rgba(34, 197, 94, 0.18)' },
  medium: { label: 'Medium', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.18)' },
  low: { label: 'Low', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.18)' },
};

function confidenceStyle(level) {
  const key = String(level || 'medium').toLowerCase();
  return CONFIDENCE_STYLES[key] || CONFIDENCE_STYLES.medium;
}

function extractJson(text) {
  const trimmed = (text || '').trim();
  if (!trimmed) throw new Error('Empty response from AI');
  try {
    return JSON.parse(trimmed);
  } catch {
    const fence = trimmed.match(/\{[\s\S]*\}/);
    if (fence) return JSON.parse(fence[0]);
    throw new Error('Could not parse nutrition data from the image');
  }
}

function normalizeFoods(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((f) => f && f.name)
    .map((f, i) => ({
      id: f.id || `ai-${Date.now()}-${i}`,
      name: String(f.name),
      calories: Math.round(Number(f.calories) || 0),
      protein: Math.round((Number(f.protein) || 0) * 10) / 10,
      carbs: Math.round((Number(f.carbs) || 0) * 10) / 10,
      fat: Math.round((Number(f.fat) || 0) * 10) / 10,
      serving: f.serving || '1 serving',
      confidence: f.confidence || 'medium',
      source: 'ai-scan',
    }));
}

async function analyzeWithAnthropic(base64, mediaType) {
  if (!API_KEY) {
    throw new Error('Add EXPO_PUBLIC_ANTHROPIC_API_KEY to your environment to use AI photo scanning.');
  }

  const prompt = `Analyze this meal photo. Identify each distinct food item and estimate nutrition per serving shown.
Return ONLY valid JSON with this shape:
{
  "description": "short meal summary",
  "foods": [
    {
      "name": "string",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "serving": "string",
      "confidence": "high" | "medium" | "low"
    }
  ]
}
Be realistic with portions. List separate items when multiple foods are visible.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1200,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const msg = errBody?.error?.message || errBody?.message;
    if (res.status === 401) throw new Error('Invalid Anthropic API key.');
    if (res.status === 429) throw new Error('AI service is busy. Please try again in a moment.');
    if (res.status === 413) throw new Error('Image is too large. Try a smaller photo.');
    throw new Error(msg || `AI analysis failed (${res.status})`);
  }

  const data = await res.json();
  const text = (data.content || [])
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n');
  const parsed = extractJson(text);
  const foods = normalizeFoods(parsed.foods);
  if (!foods.length) {
    throw new Error('No foods detected in this photo. Try a clearer image or search manually.');
  }
  const description = parsed.description || 'Meal analysis';
  const totalCal = foods.reduce((sum, f) => sum + (f.calories || 0), 0);
  return { foods, description, totalCal };
}

export default function AIPhotoScanner({ onResults, onManualSearch }) {
  const [previewUri, setPreviewUri] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!analyzing) {
      pulse.setValue(0);
      return undefined;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [analyzing, pulse]);

  const borderColor = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(170, 255, 0, 0.35)', ACCENT],
  });

  const reset = () => {
    setPreviewUri(null);
    setAnalyzing(false);
    setError(null);
    setResults(null);
  };

  const runAnalysis = useCallback(async (uri) => {
    setPreviewUri(uri);
    setAnalyzing(true);
    setError(null);
    setResults(null);
    try {
      const base64 = await uriToBase64(uri);
      const mediaType = mimeFromUri(uri);
      const data = await analyzeWithAnthropic(base64, mediaType);
      setResults(data);
    } catch (e) {
      const message = e?.message || 'Something went wrong while analyzing your meal.';
      setError(message);
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to choose a meal image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsEditing: false });
    if (!result.canceled && result.assets?.[0]?.uri) {
      await runAnalysis(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow camera access to photograph your meal.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: false });
    if (!result.canceled && result.assets?.[0]?.uri) {
      await runAnalysis(result.assets[0].uri);
    }
  };

  const handleLogOne = (food) => {
    if (!results) return;
    onResults?.([{ ...food, ...(previewUri ? { scanImageUri: previewUri } : {}) }]);
  };

  const handleLogAll = () => {
    if (!results) return;
    onResults?.(results.foods.map((f) => ({ ...f, ...(previewUri ? { scanImageUri: previewUri } : {}) })));
  };

  if (!previewUri && !results && !error) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>AI Photo Scanner</Text>
        <Text style={styles.subtitle}>Snap or upload a meal for instant nutrition estimates</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={takePhoto} activeOpacity={0.85}>
          <Feather name="camera" size={20} color={BG} />
          <Text style={styles.primaryBtnText}>Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={pickFromGallery} activeOpacity={0.85}>
          <Feather name="image" size={20} color={ACCENT} />
          <Text style={styles.secondaryBtnText}>From Gallery</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      {previewUri ? (
        <Animated.View style={[styles.previewFrame, analyzing && { borderColor }]}>
          <Image source={{ uri: previewUri }} style={styles.preview} resizeMode="cover" />
          {analyzing ? (
            <View style={styles.analyzingOverlay}>
              <ActivityIndicator color={ACCENT} size="large" />
              <Text style={styles.analyzingText}>Analyzing your meal...</Text>
            </View>
          ) : null}
        </Animated.View>
      ) : null}

      {error ? (
        <View style={styles.errorBox}>
          <Feather name="alert-circle" size={22} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.linkBtn} onPress={() => onManualSearch?.()}>
            <Text style={styles.linkText}>Search Manually</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={reset}>
            <Text style={styles.secondaryBtnText}>Try Another Photo</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {results && !analyzing ? (
        <View style={styles.results}>
          <Text style={styles.resultsTitle}>{results.description}</Text>
          <Text style={styles.totalCal}>{results.totalCal} cal total (estimated)</Text>
          {results.foods.map((food) => {
            const badge = confidenceStyle(food.confidence);
            return (
              <View key={food.id} style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Text style={styles.foodName} numberOfLines={2}>{food.name}</Text>
                  <View style={[styles.confBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.confText, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                </View>
                <Text style={styles.serving}>{food.serving}</Text>
                <Text style={styles.calories}>{food.calories} cal · P {food.protein}g · C {food.carbs}g · F {food.fat}g</Text>
                <TouchableOpacity style={styles.logOneBtn} onPress={() => handleLogOne(food)} activeOpacity={0.85}>
                  <Text style={styles.logOneText}>Log This</Text>
                </TouchableOpacity>
              </View>
            );
          })}
          <TouchableOpacity style={styles.primaryBtn} onPress={handleLogAll} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Log All Items</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={reset}>
            <Text style={styles.secondaryBtnText}>Scan Another Meal</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: BG },
  scrollContent: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#888888', marginBottom: 20, lineHeight: 20 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: ACCENT,
    borderRadius: 10,
    paddingVertical: 14,
    marginBottom: 10,
  },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: BG },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    backgroundColor: SURFACE,
    borderRadius: 10,
    paddingVertical: 14,
    marginBottom: 10,
  },
  secondaryBtnText: { fontSize: 15, fontWeight: '600', color: ACCENT },
  previewFrame: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(170, 255, 0, 0.35)',
    marginBottom: 16,
  },
  preview: { width: '100%', height: 240, backgroundColor: SURFACE },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 10, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  analyzingText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  errorBox: {
    backgroundColor: SURFACE,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    gap: 10,
    alignItems: 'flex-start',
  },
  errorText: { color: '#FFFFFF', fontSize: 14, lineHeight: 20 },
  linkBtn: { paddingVertical: 4 },
  linkText: { color: ACCENT, fontWeight: '600', fontSize: 14 },
  results: { gap: 4 },
  resultsTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  totalCal: { fontSize: 14, color: ACCENT, marginBottom: 12, fontWeight: '600' },
  resultCard: {
    backgroundColor: SURFACE,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  resultHeader: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  foodName: { flex: 1, fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  confBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  confText: { fontSize: 11, fontWeight: '700' },
  serving: { fontSize: 12, color: '#888888', marginTop: 6 },
  calories: { fontSize: 13, color: '#AAAAAA', marginTop: 6, marginBottom: 10 },
  logOneBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ACCENT,
  },
  logOneText: { color: ACCENT, fontWeight: '700', fontSize: 13 },
});
