import { TouchableOpacity, Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { radius } from '../../constants/theme';

export default function GoogleSignInButton({ onPress, loading, disabled }) {
  return (
    <TouchableOpacity
      style={[styles.btn, (loading || disabled) && styles.disabled]}
      onPress={onPress}
      disabled={loading || disabled}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color="#333" />
      ) : (
        <>
          <View style={styles.gWrap}>
            <Text style={styles.gBlue}>G</Text>
          </View>
          <Text style={styles.label}>Continue with Google</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: radius.sm,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 50,
    width: '100%',
    gap: 12,
  },
  disabled: { opacity: 0.6 },
  gWrap: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  gBlue: { fontSize: 18, fontWeight: '800', color: '#4285F4' },
  label: { fontSize: 15, fontWeight: '600', color: '#333333' },
});
