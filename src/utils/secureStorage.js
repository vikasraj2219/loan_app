import * as SecureStore from 'expo-secure-store';

// Thin wrapper around expo-secure-store (Keychain on iOS, Keystore-backed
// EncryptedSharedPreferences on Android) — this is the mobile equivalent of
// the web app's localStorage token storage, but encrypted at rest.
const KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
};

export const secureStorage = {
  async getAccessToken() {
    return SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
  },
  async getRefreshToken() {
    return SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
  },
  async getUser() {
    const raw = await SecureStore.getItemAsync(KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  },
  async setSession({ accessToken, refreshToken, user }) {
    await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, accessToken);
    await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refreshToken);
    await SecureStore.setItemAsync(KEYS.USER, JSON.stringify(user));
  },
  async setAccessToken(token) {
    await SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, token);
  },
  async setUser(user) {
    await SecureStore.setItemAsync(KEYS.USER, JSON.stringify(user));
  },
  async clearSession() {
    await SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN);
    await SecureStore.deleteItemAsync(KEYS.USER);
  },
};
