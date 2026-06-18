import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { effectiveSubscriptionStatus } from '../utils/subscription';

const NAV = [
  { name: 'Log', icon: 'book-open', label: 'Daily Log' },
  { name: 'Progress', icon: 'trending-up', label: 'Progress' },
  { name: 'Meals', icon: 'coffee', label: 'Meal Planner' },
  { name: 'AI', icon: 'message-circle', label: 'AI Coach' },
  { name: 'Profile', icon: 'user', label: 'Profile' },
];

function subBadge(profile, colors) {
  if (profile.isFounder) return { label: 'Founder', color: '#F59E0B' };
  const s = effectiveSubscriptionStatus(profile);
  if (s === 'trial') return { label: 'Pro Trial', color: colors.accent };
  if (s === 'pro') return { label: 'Pro', color: colors.accent };
  return { label: 'Free', color: colors.textMuted };
}

export default function Sidebar({ activeRoute, onNavigate }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { profile } = useUser();
  const { user } = useAuth();
  const badge = subBadge(profile, colors);

  return (
    <View style={styles.sidebar}>
      {/* Logo */}
      <View style={styles.logoWrap}>
        <View style={styles.logoIcon}>
          <Text style={styles.logoEmoji}>🌱</Text>
        </View>
        <View>
          <Text style={styles.logoText}>Foodprint</Text>
          <Text style={styles.logoSub}>Precision Nutrition</Text>
        </View>
      </View>

      {/* Nav items */}
      <View style={styles.navSection}>
        {NAV.map((item) => {
          const active = activeRoute === item.name;
          return (
            <TouchableOpacity
              key={item.name}
              style={[styles.navItem, active && styles.navActive]}
              onPress={() => onNavigate(item.name)}
            >
              <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
                <Feather name={item.icon} size={17} color={active ? colors.onAccent : colors.textMuted} />
              </View>
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* User footer */}
      <View style={styles.footer}>
        <View style={styles.userRow}>
          {profile.avatarUrl ? (
            <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarLetter}>{(profile.name || user?.email || '?')[0].toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>{profile.name || 'User'}</Text>
            <Text style={[styles.badge, { color: badge.color }]}>{badge.label}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  sidebar: {
    width: 240,
    height: '100%',
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    flexDirection: 'column',
    paddingTop: 0,
  },
  logoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 8,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: { fontSize: 22 },
  logoText: { fontSize: 16, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  logoSub: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  navSection: { flex: 1, paddingHorizontal: 12, paddingTop: 4 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    marginBottom: 2,
  },
  navActive: { backgroundColor: colors.accentMuted },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface2,
  },
  iconWrapActive: { backgroundColor: colors.accent },
  navLabel: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  navLabelActive: { color: colors.accent },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 16,
  },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 38, height: 38, borderRadius: 19 },
  avatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontWeight: '800', color: colors.onAccent, fontSize: 16 },
  userInfo: { flex: 1 },
  userName: { fontSize: 13, fontWeight: '700', color: colors.text },
  badge: { fontSize: 11, marginTop: 2, fontWeight: '600' },
});
