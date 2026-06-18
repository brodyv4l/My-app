import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  PanResponder,
  Animated,
  useWindowDimensions,
} from 'react-native';
import AppCalendar from '../ui/AppCalendar';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { Card } from '../ui/Card';
import BackHeader from '../layout/BackHeader';
import { Button } from '../ui/Button';
import { radius, spacing } from '../../constants/theme';
import {
  deleteProgressPhoto,
  fetchProgressPhotos,
  formatTimeBetween,
  getNearestWeight,
  getProgressPhotoUri,
  insertProgressPhoto,
} from '../../services/progressPhotos';

const ACCENT = '#AAFF00';
const GRID_GAP = 8;
const THUMB_COLUMNS = 4;
const THUMB_MAX = 96;
const THUMB_MIN = 72;

function formatPhotoDate(dateStr) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function PhotoImage({ photo, style, resizeMode = 'cover' }) {
  const uri = getProgressPhotoUri(photo);
  if (!uri) {
    return (
      <View style={[style, styles.brokenImage]}>
        <Feather name="image" size={24} color="#666" />
      </View>
    );
  }
  return <Image source={{ uri }} style={style} resizeMode={resizeMode} />;
}

export default function ProgressPhotosSection({ weightLogs = [], scrollRef, sectionYRef }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { showToast } = useToast();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const photoPositions = useRef({});
  const gridOffsetY = useRef(0);
  const swipeY = useRef(new Animated.Value(0)).current;

  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [captionModalOpen, setCaptionModalOpen] = useState(false);
  const [pendingAsset, setPendingAsset] = useState(null);
  const [caption, setCaption] = useState('');
  const [saving, setSaving] = useState(false);
  const [highlightId, setHighlightId] = useState(null);

  const [compareOpen, setCompareOpen] = useState(false);
  const [compareStep, setCompareStep] = useState('before');
  const [beforePhoto, setBeforePhoto] = useState(null);
  const [afterPhoto, setAfterPhoto] = useState(null);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const loadPhotos = useCallback(async () => {
    if (!user?.uid) {
      setPhotos([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchProgressPhotos(user.uid);
      setPhotos(data);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const markedDates = useMemo(() => photos.reduce((acc, photo) => {
    if (!acc[photo.date]) {
      acc[photo.date] = { marked: true, dotColor: ACCENT };
    }
    return acc;
  }, {}), [photos]);

  const openPicker = async (useCamera) => {
    const perm = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo access to add progress photos.');
      return;
    }

    const launcher = useCamera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    const mediaTypes = ImagePicker.MediaTypeOptions?.Images ?? ['images'];
    const result = await launcher({
      mediaTypes,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
      base64: true,
    });

    setAddSheetOpen(false);
    if (result.canceled || !result.assets?.[0]) return;

    setPendingAsset(result.assets[0]);
    setCaption('');
    setCaptionModalOpen(true);
  };

  const handleSavePhoto = async () => {
    if (!pendingAsset || !user?.uid) return;
    setSaving(true);
    try {
      await insertProgressPhoto(user.uid, {
        uri: pendingAsset.uri,
        base64: pendingAsset.base64,
        caption: caption.trim(),
      });
      setCaptionModalOpen(false);
      setPendingAsset(null);
      setCaption('');
      showToast('Photo saved! 📸', 'success');
      await loadPhotos();
    } catch (e) {
      Alert.alert('Could not save', e?.message || 'Try again.');
    } finally {
      setSaving(false);
    }
  };

  const openCompare = () => {
    setBeforePhoto(null);
    setAfterPhoto(null);
    setCompareStep('before');
    setCompareOpen(true);
  };

  const closeCompare = () => {
    setCompareOpen(false);
    setBeforePhoto(null);
    setAfterPhoto(null);
    setCompareStep('before');
    swipeY.setValue(0);
  };

  const openViewer = (index) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  const handleDeletePhoto = () => {
    const photo = photos[viewerIndex];
    if (!photo) return;
    Alert.alert(
      'Delete this photo?',
      'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteProgressPhoto(user.uid, photo.id);
            setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
            setViewerOpen(false);
            showToast('Photo deleted', 'info');
          },
        },
      ],
    );
  };

  const scrollToPhotoDate = (dateStr) => {
    const match = photos.find((p) => p.date === dateStr);
    if (!match) return;
    const photoY = photoPositions.current[match.id];
    if (photoY != null && scrollRef?.current) {
      const baseY = sectionYRef?.current ?? 0;
      scrollRef.current.scrollTo({ y: Math.max(baseY + photoY - 24, 0), animated: true });
    }
    setHighlightId(match.id);
    setTimeout(() => setHighlightId(null), 1200);
  };

  const comparisonStats = useMemo(() => {
    if (!beforePhoto || !afterPhoto) return null;
    const beforeWeight = getNearestWeight(weightLogs, beforePhoto.date);
    const afterWeight = getNearestWeight(weightLogs, afterPhoto.date);
    return {
      timeLabel: formatTimeBetween(beforePhoto.date, afterPhoto.date),
      beforeWeight,
      afterWeight,
    };
  }, [beforePhoto, afterPhoto, weightLogs]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 8 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) swipeY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 120) {
          closeCompare();
        } else {
          Animated.spring(swipeY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    }),
  ).current;

  const gridWidth = windowWidth - spacing.md * 2 - 32;
  const rawCell = (gridWidth - GRID_GAP * (THUMB_COLUMNS - 1)) / THUMB_COLUMNS;
  const cellSize = Math.min(THUMB_MAX, Math.max(THUMB_MIN, rawCell));
  const viewerImgSize = {
    width: Math.min(windowWidth - 24, 520),
    height: Math.min(windowHeight * 0.62, 640),
  };

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Progress Photos</Text>
        <View style={styles.headerActions}>
          {photos.length >= 2 && (
            <TouchableOpacity style={styles.compareBtn} onPress={openCompare}>
              <Text style={styles.compareBtnText}>Compare</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.addBtn} onPress={() => setAddSheetOpen(true)}>
            <Text style={styles.addBtnText}>+ Add Photo</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginVertical: 24 }} />
      ) : photos.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Feather name="camera" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No progress photos yet</Text>
          <Text style={styles.emptySub}>Add your first photo to start tracking your journey</Text>
          <Button title="+ Add Your First Photo" onPress={() => setAddSheetOpen(true)} style={{ marginTop: 12 }} />
        </View>
      ) : (
        <>
          <AppCalendar
            markedDates={markedDates}
            onDayPress={(day) => scrollToPhotoDate(day.dateString)}
            theme={{
              calendarBackground: '#141414',
              textSectionTitleColor: '#888888',
              dayTextColor: '#FFFFFF',
              todayTextColor: ACCENT,
              selectedDayBackgroundColor: ACCENT,
              selectedDayTextColor: '#000000',
              monthTextColor: '#FFFFFF',
              arrowColor: ACCENT,
              dotColor: ACCENT,
            }}
            style={styles.calendar}
          />

          <View style={styles.grid} onLayout={(e) => { gridOffsetY.current = e.nativeEvent.layout.y; }}>
            {photos.map((photo, index) => (
              <TouchableOpacity
                key={photo.id}
                style={[
                  styles.thumbWrap,
                  { width: cellSize },
                  highlightId === photo.id && styles.thumbHighlight,
                ]}
                onPress={() => openViewer(index)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={`View progress photo from ${formatPhotoDate(photo.date)}`}
                onLayout={(e) => {
                  photoPositions.current[photo.id] = gridOffsetY.current + e.nativeEvent.layout.y;
                }}
              >
                <View style={[styles.thumbFrame, { width: cellSize, height: cellSize }]}>
                  <PhotoImage photo={photo} style={styles.thumb} />
                  <View style={styles.expandBadge}>
                    <Feather name="maximize-2" size={12} color="#fff" />
                  </View>
                </View>
                <Text style={styles.thumbDate}>{formatPhotoDate(photo.date)}</Text>
                {!!photo.caption && <Text style={styles.thumbCaption} numberOfLines={1}>{photo.caption}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Add photo bottom sheet */}
      <Modal visible={addSheetOpen} transparent animationType="slide" onRequestClose={() => setAddSheetOpen(false)}>
        <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={() => setAddSheetOpen(false)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Add Progress Photo</Text>
          <TouchableOpacity style={styles.sheetOption} onPress={() => openPicker(true)}>
            <Text style={styles.sheetOptionText}>📸 Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sheetOption} onPress={() => openPicker(false)}>
            <Text style={styles.sheetOptionText}>🖼️ Choose from Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sheetCancel} onPress={() => setAddSheetOpen(false)}>
            <Text style={styles.sheetCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Caption + save */}
      <Modal visible={captionModalOpen} transparent animationType="fade" onRequestClose={() => setCaptionModalOpen(false)}>
        <View style={styles.captionOverlay}>
          <View style={styles.captionCard}>
            {pendingAsset?.uri && (
              <Image source={{ uri: pendingAsset.uri }} style={styles.captionPreview} resizeMode="cover" />
            )}
            <Text style={styles.captionLabel}>Add a note (optional)</Text>
            <TextInput
              style={styles.captionInput}
              value={caption}
              onChangeText={setCaption}
              placeholder="Front view, Side view, Week 1…"
              placeholderTextColor={colors.textMuted}
            />
            <Button title={saving ? 'Saving…' : 'Save Photo'} onPress={handleSavePhoto} disabled={saving} />
            <TouchableOpacity onPress={() => setCaptionModalOpen(false)} style={{ marginTop: 12 }}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Compare flow */}
      <Modal visible={compareOpen} animationType="slide" onRequestClose={closeCompare}>
        <Animated.View
          style={[styles.fullScreen, { transform: [{ translateY: swipeY }] }]}
          {...(compareStep === 'view' ? panResponder.panHandlers : {})}
        >
          {compareStep !== 'view' ? (
            <>
              <BackHeader
                onBack={closeCompare}
                title={compareStep === 'before' ? 'Select Before Photo' : 'Select After Photo'}
              />
              <ScrollView contentContainerStyle={styles.selectGrid}>
                {photos.map((photo) => {
                  const isBefore = beforePhoto?.id === photo.id;
                  const isAfter = afterPhoto?.id === photo.id;
                  const disabled = compareStep === 'after' && beforePhoto?.id === photo.id;
                  return (
                    <TouchableOpacity
                      key={photo.id}
                      style={[
                        styles.selectCell,
                        (isBefore || isAfter) && styles.selectCellActive,
                        disabled && styles.selectCellDisabled,
                      ]}
                      disabled={disabled}
                      onPress={() => {
                        if (compareStep === 'before') setBeforePhoto(photo);
                        else setAfterPhoto(photo);
                      }}
                    >
                      <PhotoImage photo={photo} style={styles.selectImg} />
                      {(isBefore || isAfter) && (
                        <View style={styles.selectBadge}>
                          <Text style={styles.selectBadgeText}>{isBefore ? 'BEFORE' : 'AFTER'}</Text>
                        </View>
                      )}
                      <Text style={styles.selectDate}>{formatPhotoDate(photo.date)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <View style={styles.modalFooter}>
                {compareStep === 'before' ? (
                  <Button
                    title="Next →"
                    onPress={() => setCompareStep('after')}
                    disabled={!beforePhoto}
                  />
                ) : (
                  <Button
                    title="Compare →"
                    onPress={() => setCompareStep('view')}
                    disabled={!afterPhoto}
                  />
                )}
              </View>
            </>
          ) : (
            <>
              <View style={[styles.modalHeader, { paddingTop: insets.top + 12 }]}>
                <TouchableOpacity
                  onPress={() => { setCompareStep('before'); setAfterPhoto(null); }}
                  style={styles.backHit}
                >
                  <Text style={styles.backBtn}>↩ Select Different Photos</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={closeCompare} style={styles.backHit}>
                  <Text style={styles.closeBtn}>✕ Close</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.compareRow}>
                {[beforePhoto, afterPhoto].map((photo, idx) => (
                  <View key={photo.id} style={styles.compareHalf}>
                    <View style={styles.compareLabelWrap}>
                      <Text style={styles.compareLabel}>{idx === 0 ? 'BEFORE' : 'AFTER'}</Text>
                    </View>
                    <PhotoImage photo={photo} style={styles.compareImg} />
                    <Text style={styles.compareMeta}>{formatPhotoDate(photo.date)}</Text>
                    {!!photo.caption && <Text style={styles.compareCaption}>{photo.caption}</Text>}
                  </View>
                ))}
              </View>
              {comparisonStats && (
                <View style={styles.statsCard}>
                  <Text style={styles.statsLine}>📅 Time between photos</Text>
                  <Text style={styles.statsValue}>{comparisonStats.timeLabel}</Text>
                  {comparisonStats.beforeWeight != null && comparisonStats.afterWeight != null && (
                    <>
                      <Text style={[styles.statsLine, { marginTop: 12 }]}>⚖️ Weight change</Text>
                      <Text style={styles.statsValue}>
                        From {comparisonStats.beforeWeight}lbs → {comparisonStats.afterWeight}lbs (
                        {comparisonStats.afterWeight - comparisonStats.beforeWeight > 0 ? '+' : ''}
                        {(comparisonStats.afterWeight - comparisonStats.beforeWeight).toFixed(1)} lbs)
                      </Text>
                    </>
                  )}
                </View>
              )}
              <View style={styles.modalFooter}>
                <Button
                  title="📤 Share"
                  variant="outline"
                  onPress={() => {
                    if (Platform.OS === 'web') {
                      Alert.alert('Share', 'Save a screenshot to share your progress!');
                    } else {
                      Alert.alert('Share', 'Save a screenshot to share your progress!');
                    }
                  }}
                />
              </View>
            </>
          )}
        </Animated.View>
      </Modal>

      {/* Photo viewer */}
      <Modal visible={viewerOpen} animationType="fade" onRequestClose={() => setViewerOpen(false)}>
        <View style={styles.viewerScreen}>
          <View style={styles.viewerTopBar}>
            <TouchableOpacity onPress={handleDeletePhoto} hitSlop={12}>
              <Feather name="trash-2" size={22} color="#EF4444" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setViewerOpen(false)} hitSlop={12}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          {photos[viewerIndex] && (
            <>
              <ScrollView
                maximumZoomScale={3}
                minimumZoomScale={1}
                contentContainerStyle={styles.viewerScroll}
                centerContent
              >
                <PhotoImage
                  photo={photos[viewerIndex]}
                  style={[styles.viewerImg, viewerImgSize]}
                  resizeMode="contain"
                />
              </ScrollView>
              <View style={styles.viewerMeta}>
                <Text style={styles.viewerDate}>{formatPhotoDate(photos[viewerIndex].date)}</Text>
                {!!photos[viewerIndex].caption && (
                  <Text style={styles.viewerCaption}>{photos[viewerIndex].caption}</Text>
                )}
              </View>
              <View style={styles.viewerNav}>
                <TouchableOpacity
                  disabled={viewerIndex >= photos.length - 1}
                  onPress={() => setViewerIndex((i) => Math.min(i + 1, photos.length - 1))}
                  accessibilityLabel="Previous photo"
                >
                  <Feather name="chevron-left" size={32} color={viewerIndex >= photos.length - 1 ? '#444' : '#fff'} />
                </TouchableOpacity>
                <Text style={styles.viewerCounter}>{viewerIndex + 1} / {photos.length}</Text>
                <TouchableOpacity
                  disabled={viewerIndex <= 0}
                  onPress={() => setViewerIndex((i) => Math.max(i - 1, 0))}
                  accessibilityLabel="Next photo"
                >
                  <Feather name="chevron-right" size={32} color={viewerIndex <= 0 ? '#444' : '#fff'} />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>
    </Card>
  );
}

const styles = StyleSheet.create({
  brokenImage: { backgroundColor: '#222', alignItems: 'center', justifyContent: 'center' },
});

const makeStyles = (colors) => StyleSheet.create({
  card: { marginBottom: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addBtn: { backgroundColor: colors.accent, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.sm },
  addBtnText: { color: colors.onAccent, fontSize: 12, fontWeight: '700' },
  compareBtn: { borderWidth: 1, borderColor: colors.accent, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.sm },
  compareBtnText: { color: colors.accent, fontSize: 12, fontWeight: '700' },
  emptyWrap: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginTop: 8 },
  emptySub: { color: colors.textMuted, fontSize: 13, textAlign: 'center', paddingHorizontal: 16 },
  calendar: { borderRadius: radius.md, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
  thumbWrap: { marginBottom: 4 },
  thumbHighlight: { borderWidth: 2, borderColor: colors.accent, borderRadius: 10, padding: 2 },
  thumbFrame: { borderRadius: 8, overflow: 'hidden', position: 'relative' },
  thumb: { width: '100%', height: '100%', borderRadius: 8 },
  expandBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 4,
    padding: 4,
  },
  thumbDate: { fontSize: 11, color: colors.text, marginTop: 4, textAlign: 'center' },
  thumbCaption: { fontSize: 10, color: colors.textMuted, textAlign: 'center' },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, paddingBottom: 32 },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12, textAlign: 'center' },
  sheetOption: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  sheetOptionText: { fontSize: 16, color: colors.text, textAlign: 'center' },
  sheetCancel: { paddingVertical: 14, marginTop: 8 },
  sheetCancelText: { fontSize: 15, color: colors.textMuted, textAlign: 'center' },
  captionOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  captionCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 16 },
  captionPreview: { width: '100%', height: 200, borderRadius: radius.sm, marginBottom: 12 },
  captionLabel: { color: colors.text, fontWeight: '600', marginBottom: 8 },
  captionInput: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: 12,
    color: colors.text,
    marginBottom: 12,
  },
  fullScreen: { flex: 1, backgroundColor: colors.bg },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 16 : 48,
    paddingBottom: 12,
  },
  modalTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  closeBtn: { color: colors.text, fontSize: 18, fontWeight: '700' },
  backBtn: { color: colors.accent, fontSize: 13, fontWeight: '600', flex: 1 },
  backHit: { minHeight: 44, minWidth: 44, justifyContent: 'center' },
  selectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 16 },
  selectCell: { width: '47%', borderRadius: 10, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  selectCellActive: { borderColor: colors.accent },
  selectCellDisabled: { opacity: 0.35 },
  selectImg: { width: '100%', aspectRatio: 3 / 4 },
  selectBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  selectBadgeText: { color: colors.accent, fontSize: 10, fontWeight: '800' },
  selectDate: { color: colors.textMuted, fontSize: 12, textAlign: 'center', padding: 6 },
  modalFooter: { padding: 16, paddingBottom: 32 },
  compareRow: { flexDirection: 'row', flex: 1, minHeight: 280 },
  compareHalf: { flex: 1, padding: 4 },
  compareLabelWrap: { position: 'absolute', top: 8, left: 8, zIndex: 2, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  compareLabel: { color: '#fff', fontSize: 11, fontWeight: '800' },
  compareImg: { width: '100%', flex: 1, borderRadius: 4 },
  compareMeta: { color: colors.text, fontSize: 12, marginTop: 6, textAlign: 'center' },
  compareCaption: { color: colors.textMuted, fontSize: 11, textAlign: 'center' },
  statsCard: { margin: 16, backgroundColor: colors.surface, borderRadius: radius.md, padding: 16, borderWidth: 1, borderColor: colors.border },
  statsLine: { color: colors.textMuted, fontSize: 13 },
  statsValue: { color: colors.text, fontSize: 15, fontWeight: '700', marginTop: 4 },
  viewerScreen: { flex: 1, backgroundColor: '#000' },
  viewerTopBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, paddingTop: Platform.OS === 'web' ? 16 : 48 },
  viewerScroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12 },
  viewerImg: { maxWidth: 520 },
  viewerMeta: { padding: 16, alignItems: 'center' },
  viewerDate: { color: '#fff', fontSize: 16, fontWeight: '700' },
  viewerCaption: { color: '#aaa', fontSize: 14, marginTop: 4 },
  viewerNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 32 },
  viewerCounter: { color: '#fff', fontSize: 14 },
});
