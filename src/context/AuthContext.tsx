import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { Session } from '../types';

interface AuthContextValue {
  session: Session | null;
  login: (username: string, token: string, balance: number) => void;
  logout: () => void;
  updateBalance: (balance: number) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => {
    try {
      const raw = localStorage.getItem('betboyz:session');
      return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback((username: string, token: string, balance: number) => {
    const s: Session = { username, token, balance };
    localStorage.setItem('betboyz:session', JSON.stringify(s));
    setSession(s);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('betboyz:session');
    setSession(null);
  }, []);

  const updateBalance = useCallback((balance: number) => {
    setSession((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, balance };
      localStorage.setItem('betboyz:session', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ session, login, logout, updateBalance }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
