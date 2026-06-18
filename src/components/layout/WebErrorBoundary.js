import { Component } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

export default class WebErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error('App crash:', error);
  }

  render() {
    if (this.state.error && Platform.OS === 'web') {
      return (
        <View style={styles.wrap}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.msg}>{this.state.error.message || 'Unknown error'}</Text>
          <Text style={styles.hint}>Try a hard refresh (Ctrl+Shift+R) or clear site data for this URL.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 12 },
  msg: { color: '#AAFF00', fontSize: 14, textAlign: 'center', marginBottom: 16 },
  hint: { color: '#888', fontSize: 13, textAlign: 'center' },
});
