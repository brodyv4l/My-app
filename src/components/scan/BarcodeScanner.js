import { Platform } from 'react-native';
import NativeBarcodeScanner from './NativeBarcodeScanner';
import WebBarcodeScanner from './WebBarcodeScanner';

export default function BarcodeScanner(props) {
  if (Platform.OS === 'web') {
    return <WebBarcodeScanner {...props} />;
  }
  return <NativeBarcodeScanner {...props} />;
}
