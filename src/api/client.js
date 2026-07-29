import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT_MS } from '../config';
import { secureStorage } from '../utils/secureStorage';

const api = axios.create({ baseURL: API_BASE_URL, timeout: API_TIMEOUT_MS });

// Attach the access token to every outgoing request.
api.interceptors.request.use(async (config) => {
  const token = await secureStorage.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// This gets set by AuthContext so the interceptor can force a logout
// (and the navigator can redirect to Login) when a refresh fails.
let onSessionExpired = () => {};
export const setOnSessionExpired = (handler) => {
  onSessionExpired = handler;
};

let isRefreshing = false;
let queue = [];

const processQueue = (error, token = null) => {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  queue = [];
};

// Same silent-refresh-then-retry pattern as the web app: on a 401 from any
// non-auth endpoint, try the refresh token once; if that also fails, clear
// the session and let the app fall back to the Login screen.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await secureStorage.getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        const newAccessToken = data.data.accessToken;

        await secureStorage.setAccessToken(newAccessToken);
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await secureStorage.clearSession();
        onSessionExpired();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
