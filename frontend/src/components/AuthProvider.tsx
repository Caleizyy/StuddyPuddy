import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getCurrentUser, loginUser, logoutUser, type AuthUser } from '@/api/auth';
import { setAuthToken, setUnauthorizedHandler } from '@/api/client';
import { AuthContext, type AuthStatus } from '@/lib/authContext';

const TOKEN_KEY = 'studdypuddy.token';

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null; // storage unavailable
  }
}

function storeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable: the session just won't survive a refresh */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>(() =>
    readStoredToken() ? 'loading' : 'anonymous',
  );

  const clearSession = useCallback(() => {
    setAuthToken(null);
    storeToken(null);
    setUser(null);
    setStatus('anonymous');
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    const token = readStoredToken();
    if (token) {
      setAuthToken(token);
      getCurrentUser()
        .then((result) => {
          setUser(result.user);
          setStatus('authenticated');
        })
        .catch(clearSession);
    }
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginUser({ email, password });
    setAuthToken(result.token);
    storeToken(result.token);
    setUser(result.user);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      /* clear the local session even if the server can't be reached */
    }
    clearSession();
  }, [clearSession]);

  const value = useMemo(() => ({ user, status, login, logout }), [user, status, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
