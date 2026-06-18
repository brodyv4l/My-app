import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useTheme } from '../../context/ThemeContext';

export default function OfflineBanner() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isOnline = useNetworkStatus();
  if (isOnline) return null;
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>📡 Offline — showing cached data</Text>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  banner: { backgroundColor: colors.surface2, paddingVertical: 6, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  text: { color: colors.textMuted, fontSize: 12, textAlign: 'center', fontWeight: '500' },
});
