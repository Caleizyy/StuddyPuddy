import { useCallback, useEffect, useMemo, useState, useRef, type ReactNode } from 'react';
import { getCurrentUser, loginUser, logoutUser, type AuthUser } from '@/api/auth';
import { setAuthToken, setUnauthorizedHandler, ApiError } from '@/api/client';
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
  // The token the current session belongs to; results for any other token are stale
  const activeToken = useRef<string | null>(null);

  const clearSession = useCallback(() => {
    activeToken.current = null;
    setAuthToken(null);
    storeToken(null);
    setUser(null);
    setStatus('anonymous');
  }, []);

  const restoreSession = useCallback((token: string) => {
    activeToken.current = token;
    setAuthToken(token);
    setStatus('loading');
    getCurrentUser()
      .then((result) => {
        if (activeToken.current !== token) return; // replaced by a newer login or logout
        setUser(result.user);
        setStatus('authenticated');
      })
      .catch((error: unknown) => {
        if (activeToken.current !== token) return;
        // A 401 is already handled by the unauthorized handler, which clears the session
        if (error instanceof ApiError && error.status === 401) return;
        // Network or server problem: keep the token and let the user retry
        setStatus('unavailable');
      });
  }, []);

  useEffect(() => {
    setUnauthorizedHandler((tokenUsed) => {
      if (tokenUsed === activeToken.current) clearSession();
    });
    const token = readStoredToken();
    if (token) restoreSession(token);
    return () => setUnauthorizedHandler(null);
  }, [clearSession, restoreSession]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginUser({ email, password });
    activeToken.current = result.token;
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

  const retry = useCallback(() => {
    const token = activeToken.current ?? readStoredToken();
    if (token) restoreSession(token);
    else clearSession();
  }, [clearSession, restoreSession]);

  const value = useMemo(
    () => ({ user, status, login, logout, retry }),
    [user, status, login, logout, retry],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
