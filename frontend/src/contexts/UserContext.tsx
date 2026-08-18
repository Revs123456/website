'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { userApi, type SiteUser, storeUserCsrfToken, clearUserCsrfToken } from '@/lib/api';

type UserContextValue = {
  user: SiteUser | null;
  loading: boolean;
  /**
   * Hydrate the context after a successful verifyOtp call.
   * Pass the user + the CSRF token returned by the API (we can't read it from
   * cookies cross-domain, so the API returns it in the body).
   */
  setSession: (user: SiteUser, csrfToken: string) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  /** Optimistic local update — used after PATCH /users/profile succeeds. */
  patchLocal: (patch: Partial<SiteUser>) => void;
};

const UserContext = createContext<UserContextValue>({
  user: null,
  loading: true,
  setSession: () => {},
  refresh: async () => {},
  logout: async () => {},
  patchLocal: () => {},
});

const LS_KEY = 'tch_user';

/**
 * UserProvider strategy:
 *   1. On mount, immediately surface `tch_user` from localStorage so the navbar
 *      doesn't flicker between "logged out" → "logged in" on every refresh.
 *      This is purely a UI hint — server still validates the cookie on every API call.
 *   2. In parallel, call /users/me to confirm the session is still valid. If the
 *      CSRF token is missing this will trigger a /users/refresh underneath.
 *   3. On 401, clear local state. UI components should NOT redirect; they should
 *      render their own logged-out fallback.
 */
export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SiteUser | null>(null);
  const [loading, setLoading] = useState(true);

  const setSession = useCallback((nextUser: SiteUser, csrfToken: string) => {
    storeUserCsrfToken(csrfToken);
    setUser(nextUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LS_KEY, JSON.stringify(nextUser));
    }
  }, []);

  const patchLocal = useCallback((patch: Partial<SiteUser>) => {
    setUser(prev => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      if (typeof window !== 'undefined') localStorage.setItem(LS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const refresh = useCallback(async () => {
    try {
      const me = await userApi.me();
      setUser(me);
      if (typeof window !== 'undefined') localStorage.setItem(LS_KEY, JSON.stringify(me));
    } catch {
      setUser(null);
      if (typeof window !== 'undefined') localStorage.removeItem(LS_KEY);
      clearUserCsrfToken();
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try { await userApi.logout(); } catch { /* fall through — clear local state regardless */ }
    setUser(null);
    if (typeof window !== 'undefined') localStorage.removeItem(LS_KEY);
    clearUserCsrfToken();
  }, []);

  // Initial hydration
  useEffect(() => {
    if (typeof window === 'undefined') { setLoading(false); return; }
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      localStorage.removeItem(LS_KEY);
    }
    void refresh();
  }, [refresh]);

  return (
    <UserContext.Provider value={{ user, loading, setSession, refresh, logout, patchLocal }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  return useContext(UserContext);
}
