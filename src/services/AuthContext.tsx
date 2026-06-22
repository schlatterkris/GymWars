import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { initGoogleAuth, signIn, signOut } from './gapi';
import { api } from './api';

interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: () => Promise<User>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initGoogleAuth().then(() => {
      const stored = localStorage.getItem('gymwars_user');
      if (stored) {
        try { setUser(JSON.parse(stored)); } catch { /* */ }
      }
      setLoading(false);
    });
  }, []);

  const login = useCallback(async () => {
    const info = await signIn();
    const existing = await api.users.get(info.email);
    const u: User = existing || await api.users.create({ email: info.email, name: info.name });
    localStorage.setItem('gymwars_user', JSON.stringify(u));
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    signOut();
    localStorage.removeItem('gymwars_user');
    setUser(null);
  }, []);

  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
