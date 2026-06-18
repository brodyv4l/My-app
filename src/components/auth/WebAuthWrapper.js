import { View, useWindowDimensions, StyleSheet, Platform } from 'react-native';

export function WebAuthWrapper({ children }) {
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width >= 768;
  if (!isWide) return children;
  return (
    <View style={authWrapStyles.bg}>
      <View style={authWrapStyles.card}>{children}</View>
    </View>
  );
}

const authWrapStyles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#141414',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    overflow: 'hidden',
    maxHeight: '90vh',
  },
});