import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// RN has no built-in binary-safe base64 encoder for large ArrayBuffers, so
// this is a small manual implementation — fine for report-sized files.
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let result = '';
  let i;
  for (i = 0; i + 2 < bytes.length; i += 3) {
    const chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    result += CHARS[(chunk >> 18) & 63] + CHARS[(chunk >> 12) & 63] + CHARS[(chunk >> 6) & 63] + CHARS[chunk & 63];
  }
  const remaining = bytes.length - i;
  if (remaining === 1) {
    const chunk = bytes[i] << 16;
    result += CHARS[(chunk >> 18) & 63] + CHARS[(chunk >> 12) & 63] + '==';
  } else if (remaining === 2) {
    const chunk = (bytes[i] << 16) | (bytes[i + 1] << 8);
    result += CHARS[(chunk >> 18) & 63] + CHARS[(chunk >> 12) & 63] + CHARS[(chunk >> 6) & 63] + '=';
  }
  return result;
}

const MIME_TYPES = {
  csv: 'text/csv',
  excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf: 'application/pdf',
};

const EXTENSIONS = { csv: 'csv', excel: 'xlsx', pdf: 'pdf' };

export async function saveAndShareExport(arrayBuffer, { format, fileNamePrefix }) {
  const base64 = arrayBufferToBase64(arrayBuffer);
  const fileName = `${fileNamePrefix}-${Date.now()}.${EXTENSIONS[format] || format}`;
  const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, { mimeType: MIME_TYPES[format], dialogTitle: fileName });
  }
  return fileUri;
}
