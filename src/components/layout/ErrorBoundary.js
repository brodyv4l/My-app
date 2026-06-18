import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.warn('ErrorBoundary:', error?.message, info?.componentStack);
    this.lastError = error;
  }

  render() {
    if (this.state.hasError) {
      const detail = __DEV__ && this.lastError?.message
        ? this.lastError.message
        : null;
      return (
        <View style={styles.wrap}>
          <Text style={styles.msg}>Something went wrong</Text>
          {detail ? <Text style={styles.detail}>{detail}</Text> : null}
          <TouchableOpacity
            onPress={() => this.setState({ hasError: false })}
            style={styles.btn}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
    padding: 24,
  },
  msg: { color: '#fff', marginBottom: 16, fontSize: 16 },
  detail: { color: '#888', fontSize: 13, textAlign: 'center', marginBottom: 16, paddingHorizontal: 16 },
  btn: { backgroundColor: '#AAFF00', padding: 14, borderRadius: 10, minWidth: 120, alignItems: 'center' },
  btnText: { color: '#000', fontWeight: '700' },
});
