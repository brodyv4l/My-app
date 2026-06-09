import { View, Platform, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';

const PHONE_WIDTH = 390;
const PHONE_HEIGHT = 844;
const TOP_INSET = 54;
const BOTTOM_INSET = 40;

export default function PhoneFrame({ children }) {
  if (Platform.OS !== 'web') {
    return children;
  }

  return (
    <View style={styles.outer}>
      <View style={styles.frame}>
        <View style={styles.topSafe}>
          <View style={styles.notch} />
          <View style={styles.statusBar}>
            <View style={styles.statusTime} />
            <View style={styles.statusIcons} />
          </View>
        </View>

        <View style={styles.screen}>{children}</View>

        <View style={styles.bottomSafe}>
          <View style={styles.homeIndicator} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    minHeight: '100vh',
    width: '100%',
    backgroundColor: '#050506',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  frame: {
    width: PHONE_WIDTH,
    maxWidth: '100%',
    height: PHONE_HEIGHT,
    maxHeight: 'calc(100vh - 48px)',
    backgroundColor: '#000',
    borderRadius: 44,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#27272a',
    boxShadow: '0 25px 80px rgba(0, 0, 0, 0.65), inset 0 0 0 1px rgba(255,255,255,0.06)',
  },
  topSafe: {
    height: TOP_INSET,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 10,
    position: 'relative',
  },
  notch: {
    position: 'absolute',
    top: 10,
    width: 126,
    height: 34,
    backgroundColor: '#000',
    borderRadius: 20,
    zIndex: 11,
  },
  statusBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingBottom: 6,
    height: 20,
  },
  statusTime: {
    width: 28,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  statusIcons: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  screen: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.bg,
    overflow: 'hidden',
  },
  bottomSafe: {
    height: BOTTOM_INSET,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
    zIndex: 10,
  },
  homeIndicator: {
    width: 134,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
});
