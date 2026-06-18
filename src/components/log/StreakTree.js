import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Rect, Ellipse, Path, G } from 'react-native-svg';
import { radius } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

function TreeSvg({ stage, wilted }) {
  const leaf = wilted ? '#6B7280' : '#22C55E';
  const trunk = wilted ? '#78716C' : '#92400E';
  const soil = '#3F3F46';

  if (stage === 0 || wilted) {
    return (
      <Svg width={120} height={100} viewBox="0 0 120 100">
        <Ellipse cx="60" cy="88" rx="40" ry="8" fill={soil} />
        {wilted ? (
          <G opacity={0.7}>
            <Path d="M60 80 Q45 60 35 55" stroke={trunk} strokeWidth={3} fill="none" />
            <Path d="M60 75 Q75 58 85 52" stroke={trunk} strokeWidth={3} fill="none" />
            <Circle cx="35" cy="52" r="6" fill="#6B7280" />
            <Circle cx="85" cy="50" r="6" fill="#6B7280" />
          </G>
        ) : (
          <Ellipse cx="60" cy="72" rx="10" ry="14" fill="#A16207" />
        )}
      </Svg>
    );
  }

  const h = 20 + stage * 6;
  const canopyR = 12 + stage * 4;
  const legendary = stage >= 10;

  return (
    <Svg width={120} height={110} viewBox="0 0 120 110">
      {legendary && <Circle cx="60" cy={90 - h} r={canopyR + 18} fill="rgba(245,158,11,0.15)" />}
      <Ellipse cx="60" cy="102" rx="42" ry="8" fill={soil} />
      <Rect x={56} y={90 - h} width={8} height={h} fill={trunk} rx={2} />
      {stage >= 4 && <Path d="M60 70 L40 58 M60 65 L80 55" stroke={trunk} strokeWidth={3} />}
      {stage >= 6 && <Path d="M60 60 L35 48 M60 55 L85 45" stroke={trunk} strokeWidth={3} />}
      <Circle cx="60" cy={92 - h - canopyR * 0.3} r={canopyR} fill={leaf} opacity={0.9} />
      {stage >= 3 && <Circle cx="48" cy={95 - h - canopyR * 0.2} r={canopyR * 0.55} fill={leaf} />}
      {stage >= 3 && <Circle cx="72" cy={95 - h - canopyR * 0.2} r={canopyR * 0.55} fill={leaf} />}
      {legendary && (
        <>
          <Circle cx="45" cy={80 - h} r="2" fill="#FCD34D" />
          <Circle cx="75" cy={75 - h} r="2" fill="#FCD34D" />
          <Circle cx="60" cy={65 - h} r="2" fill="#FCD34D" />
        </>
      )}
    </Svg>
  );
}

export default function StreakTree({ streakCount, streakBroken, milestoneMessage }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const stage = streakBroken ? 0 : Math.min(10, Math.floor(streakCount / 4) + (streakCount > 0 ? 1 : 0));

  return (
    <View style={styles.card}>
      <TreeSvg stage={streakCount >= 365 ? 10 : stage} wilted={streakBroken} />
      {streakBroken ? (
        <Text style={styles.wilt}>Your tree needs water. Log today to revive it 🌱</Text>
      ) : null}
      <Text style={styles.streak}>🔥 {streakCount} Day Streak</Text>
      {milestoneMessage ? <Text style={styles.milestone}>{milestoneMessage}</Text> : null}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  streak: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 8 },
  milestone: { fontSize: 14, color: colors.accent, marginTop: 6, textAlign: 'center' },
  wilt: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 8 },
});
