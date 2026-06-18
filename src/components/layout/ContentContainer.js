import { View, StyleSheet } from 'react-native';

export default function ContentContainer({ children, style }) {
  return (
    <View style={[styles.container, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%' },
});