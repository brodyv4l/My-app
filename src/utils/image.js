import * as FileSystem from 'expo-file-system';

export async function uriToBase64(uri) {
  if (uri.startsWith('data:')) {
    return uri.split(',')[1];
  }
  return FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
}

export function mimeFromUri(uri) {
  if (uri.includes('.png')) return 'image/png';
  return 'image/jpeg';
}
