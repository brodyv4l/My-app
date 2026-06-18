import { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/Button';
import { radius, spacing } from '../constants/theme';
import { getCodeStats, createCustomCode } from '../utils/subscription';
import ScreenLayout from '../components/layout/ScreenLayout';

export default function AdminScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  const { profile } = useUser();
  const [codes, setCodes] = useState([]);
  const [newCode, setNewCode] = useState('');
  const [type, setType] = useState('friend');

  useEffect(() => {
    if (!profile.isFounder) { navigation.replace('Main'); return; }
    getCodeStats().then(setCodes);
  }, [profile.isFounder, navigation]);

  if (!profile.isFounder) return null;

  return (
    <ScreenLayout>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Code Manager 👑</Text>
        {codes.map((c) => (
          <View key={c.code} style={styles.codeRow}>
            <Text style={styles.codeName}>{c.code}</Text>
            <Text style={styles.codeMeta}>{c.type} · {c.used}/{c.maxUses ?? '∞'}</Text>
          </View>
        ))}
        <TextInput style={styles.input} value={newCode} onChangeText={(t) => setNewCode(t.toUpperCase())} placeholder="CODE" placeholderTextColor={colors.textMuted} />
        <Button title="Create Code" onPress={async () => { await createCustomCode({ code: newCode, type, maxUses: 10 }); setNewCode(''); getCodeStats().then(setCodes); }} />
      </ScrollView>
    </ScreenLayout>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  content: { padding: spacing.lg },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: spacing.lg },
  codeRow: { padding: 12, backgroundColor: colors.surface, borderRadius: radius.sm, marginBottom: 6, borderWidth: 1, borderColor: colors.border },
  codeName: { fontWeight: '700', color: colors.text },
  codeMeta: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  input: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: 12, color: colors.text, marginBottom: 8 },
});
