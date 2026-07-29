import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { authApi } from '../api/authApi';
import { secureStorage } from '../utils/secureStorage';
import { setOnSessionExpired } from '../api/client';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    await secureStorage.clearSession();
    setUser(null);
  }, []);

  // Wire the API client's 401-after-failed-refresh handler to our logout,
  // so an expired session anywhere in the app drops back to Login.
  useEffect(() => {
    setOnSessionExpired(() => {
      setUser(null);
    });
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      const token = await secureStorage.getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await authApi.getMe();
        setUser(data.data.user);
        await secureStorage.setUser(data.data.user);
      } catch {
        await secureStorage.clearSession();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const login = async (email, password) => {
    const { data } = await authApi.login({ email, password });
    const { user: loggedInUser, accessToken, refreshToken } = data.data;
    await secureStorage.setSession({ accessToken, refreshToken, user: loggedInUser });
    setUser(loggedInUser);
    return loggedInUser;
  };

  const register = async (payload) => {
    const { data } = await authApi.register(payload);
    const { user: newUser, accessToken, refreshToken } = data.data;
    await secureStorage.setSession({ accessToken, refreshToken, user: newUser });
    setUser(newUser);
    return newUser;
  };

  const value = useMemo(
    () => ({ user, loading, isAuthenticated: !!user, isAdmin: user?.role === 'admin', login, register, logout }),
    [user, loading, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
