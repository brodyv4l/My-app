import { useMemo } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { radius } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

export default function ProgressPhotoCard({ photo, onSave, onViewAll }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const pick = async (useCamera) => {
    const fn = useCamera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    const result = await fn({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      onSave({ uri: result.assets[0].uri, caption: '' });
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Today's Photo</Text>
      {photo?.uri ? (
        <Image source={{ uri: photo.uri }} style={styles.thumb} />
      ) : (
        <TouchableOpacity style={styles.placeholder} onPress={() => pick(false)}>
          <Feather name="camera" size={28} color={colors.textMuted} />
          <Text style={styles.placeholderText}>Add Progress Photo</Text>
        </TouchableOpacity>
      )}
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => pick(true)}><Text style={styles.link}>Camera</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => pick(false)}><Text style={styles.link}>Gallery</Text></TouchableOpacity>
        <TouchableOpacity onPress={onViewAll}><Text style={styles.link}>View all photos</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 24 },
  title: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 },
  placeholder: { height: 140, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 8 },
  placeholderText: { color: colors.textMuted, fontSize: 14 },
  thumb: { width: '100%', height: 180, borderRadius: radius.md },
  actions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
  link: { color: colors.accent, fontSize: 13, fontWeight: '600' },
});
