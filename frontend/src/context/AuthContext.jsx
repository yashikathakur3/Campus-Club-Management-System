import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/auth';
import { clearToken, readToken, writeToken } from '../auth/storage';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState({ user: null, memberships: [], token: null, loading: true });

  useEffect(() => {
    let active = true;
    async function bootstrap() {
      const token = readToken();
      if (!token) {
        if (active) setSession({ user: null, memberships: [], token: null, loading: false });
        return;
      }

      try {
        const data = await authApi.getMe();
        if (active) setSession({ user: data.user, memberships: data.memberships || [], token, loading: false });
      } catch {
        clearToken();
        if (active) setSession({ user: null, memberships: [], token: null, loading: false });
      }
    }
    bootstrap();
    return () => { active = false; };
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await authApi.login(credentials);
    writeToken(data.token);
    setSession({ user: data.user, memberships: [], token: data.token, loading: false });
    return data;
  }, []);

  const register = useCallback(async (details) => {
    const data = await authApi.register(details);
    writeToken(data.token);
    setSession({ user: data.user, memberships: [], token: data.token, loading: false });
    return data;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setSession({ user: null, memberships: [], token: null, loading: false });
  }, []);

  const refreshMe = useCallback(async () => {
    const data = await authApi.getMe();
    setSession((current) => ({ ...current, user: data.user, memberships: data.memberships || [], loading: false }));
    return data;
  }, []);

  const value = useMemo(() => ({ ...session, login, register, logout, refreshMe }), [session, login, register, logout, refreshMe]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
