import { Platform } from 'react-native';

// Convert any image URI to a base64 string, working on both web and native.
export async function uriToBase64(uri) {
  if (!uri) throw new Error('No image URI provided');

  // Already a data URL — just strip the prefix.
  if (uri.startsWith('data:')) {
    return uri.split(',')[1];
  }

  // Web, blob:, or remote URLs — fetch the bytes and read as data URL.
  if (Platform.OS === 'web' || uri.startsWith('blob:') || uri.startsWith('http')) {
    const res = await fetch(uri);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = String(reader.result || '');
        const comma = result.indexOf(',');
        resolve(comma >= 0 ? result.slice(comma + 1) : result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Native file:// URIs — use the legacy FileSystem API (avoids the SDK 54
  // deprecation warning for readAsStringAsync).
  const FileSystem = require('expo-file-system/legacy');
  return FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
}

export function mimeFromUri(uri) {
  if (uri && uri.includes('.png')) return 'image/png';
  return 'image/jpeg';
}
