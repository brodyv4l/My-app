import { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

function contentMaxWidth(width) {
  if (width >= 1024) return 480; // desktop
  if (width >= 768) return 600; // tablet
  return null; // mobile: full width
}

export default function ScreenLayout({ children, edges = ['top'], style }) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const maxWidth = contentMaxWidth(width);

  return (
    <SafeAreaView style={[styles.safe, style]} edges={edges}>
      <View style={[styles.inner, maxWidth ? { maxWidth, alignSelf: 'center' } : null]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, width: '100%' },
});
