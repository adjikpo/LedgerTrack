import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getItem, setItem, deleteItem } from '@/lib/secure-storage';
import { apiFetch } from '@/lib/api';

export type User = { id: string; email: string; username?: string | null };

interface AuthContextValue {
  user: User | null;
  token: string | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await getItem('auth_token');
      if (saved) {
        setToken(saved);
        try {
          const me = await apiFetch('/api/auth/me', { token: saved });
          setUser(me.user);
        } catch (e) {
          await deleteItem('auth_token');
          setToken(null);
          setUser(null);
        }
      }
      setReady(true);
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiFetch('/api/auth/login', { method: 'POST', body: { email, password } });
    const newToken = res.token as string;
    await setItem('auth_token', newToken);
    setToken(newToken);
    setUser(res.user);
  };

  const logout = async () => {
    await deleteItem('auth_token');
    setToken(null);
    setUser(null);
  };

  const value = useMemo(() => ({ user, token, ready, login, logout }), [user, token, ready]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
