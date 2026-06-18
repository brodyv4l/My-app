import { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { radius } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import {
  aggregateMicronutrientsForDate,
  nutrientsBySection,
  nutrientProgress,
  progressBarColor,
} from '../../utils/micronutrients';
import PaywallOverlay from '../paywall/PaywallOverlay';

function NutrientBar({ def, value, pct, locked }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const fillPct = def.maxGoal ? Math.min(100, pct) : Math.min(100, pct);
  const color = progressBarColor(pct, def);
  const display = def.maxGoal
    ? `${Math.round(value)} / max ${def.goal}${def.unit}`
    : `${formatAmt(value)} / ${def.goal}${def.unit}`;

  return (
    <View style={[styles.row, locked && styles.rowLocked]}>
      <View style={styles.rowHeader}>
        <Text style={styles.rowLabel}>{def.label}</Text>
        <Text style={styles.rowNums}>{display}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${fillPct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function formatAmt(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '0';
  return n >= 100 ? Math.round(n).toString() : (Math.round(n * 10) / 10).toString();
}

export default function MicronutrientPanel({ foodEntries, date, isPro }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  const [open, setOpen] = useState(false);
  const [openSections, setOpenSections] = useState({ vitamins: true, minerals: false, fats: false, carbs: false });
  const [paywall, setPaywall] = useState(false);

  const totals = useMemo(() => aggregateMicronutrientsForDate(foodEntries, date), [foodEntries, date]);
  const sections = useMemo(() => nutrientsBySection(totals), [totals]);

  const flatRows = useMemo(() => sections.flatMap((s) => s.items.map((item) => ({ ...item, sectionId: s.id }))), [sections]);
  const freeVisible = 4;

  const toggleSection = (id) => setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.mainHeader} onPress={() => setOpen((v) => !v)}>
        <Text style={styles.mainTitle}>Micronutrients {open ? '\u25BE' : '\u25B8'}</Text>
        <Text style={styles.hint}>{flatRows.length ? 'Daily detail' : 'Log foods to track'}</Text>
      </TouchableOpacity>

      {open ? (
        <>
          {sections.map((section) => (
            <View key={section.id} style={styles.section}>
              <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection(section.id)}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.chevron}>{openSections[section.id] ? '\u25BE' : '\u25B8'}</Text>
              </TouchableOpacity>
              {openSections[section.id] ? (
                <View style={styles.sectionBody}>
                  {section.items.map((item, idx) => {
                    const globalIdx = flatRows.findIndex((r) => r.def.key === item.def.key);
                    const locked = !isPro && globalIdx >= freeVisible;
                    if (locked && globalIdx === freeVisible) {
                      return (
                        <TouchableOpacity key={item.def.key} style={styles.paywallInline} onPress={() => setPaywall(true)}>
                          <View style={styles.blurWrap}>
                            <NutrientBar def={item.def} value={item.value} pct={item.pct} locked />
                          </View>
                          <Text style={styles.paywallText}>Unlock 30+ micronutrients with Pro</Text>
                        </TouchableOpacity>
                      );
                    }
                    if (locked) return null;
                    return (
                      <NutrientBar key={item.def.key} def={item.def} value={item.value} pct={item.pct} />
                    );
                  })}
                </View>
              ) : null}
            </View>
          ))}

          {isPro ? (
            <TouchableOpacity style={styles.reportBtn} onPress={() => navigation.navigate('NutrientReport', { date })}>
              <Text style={styles.reportBtnText}>Full Nutrient Report</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.reportBtnMuted} onPress={() => setPaywall(true)}>
              <Text style={styles.reportBtnMutedText}>Full Nutrient Report (Pro)</Text>
            </TouchableOpacity>
          )}
        </>
      ) : null}

      <PaywallOverlay
        visible={paywall}
        featureName="Micronutrient Tracking"
        benefit="Track vitamins, minerals, and detailed macros every day"
        onDismiss={() => setPaywall(false)}
      />
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
  },
  mainHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mainTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  hint: { fontSize: 12, color: colors.textMuted },
  section: { marginTop: 14 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.accent },
  chevron: { color: colors.textMuted, fontSize: 14 },
  sectionBody: { gap: 10 },
  row: { gap: 6 },
  rowLocked: { opacity: 0.45 },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { fontSize: 13, color: colors.text, fontWeight: '500' },
  rowNums: { fontSize: 12, color: colors.textMuted },
  track: { height: 6, backgroundColor: colors.surface2, borderRadius: 99, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 99 },
  paywallInline: { marginTop: 4, borderRadius: radius.sm, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  blurWrap: { opacity: 0.35 },
  paywallText: { textAlign: 'center', color: colors.accent, fontWeight: '700', fontSize: 13, padding: 12, backgroundColor: 'rgba(0,0,0,0.5)' },
  reportBtn: {
    marginTop: 16,
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: 12,
    alignItems: 'center',
  },
  reportBtnText: { color: colors.onAccent, fontWeight: '800', fontSize: 14 },
  reportBtnMuted: {
    marginTop: 16,
    borderRadius: radius.sm,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  reportBtnMutedText: { color: colors.textMuted, fontWeight: '700', fontSize: 14 },
});
