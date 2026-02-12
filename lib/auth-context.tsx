'use client';

import { useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const AUTH_STORAGE_KEY = 'opositaplus_user';
const DEMO_PASSWORD = 'demo1234';
const ALLOWED_DOMAIN = '@opositaplus.es';

export interface AuthUser {
  email: string;
  name: string;
  avatar: string;
  loggedIn: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function safeParseUser(value: string | null): AuthUser | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<AuthUser>;
    if (
      typeof parsed.email === 'string' &&
      typeof parsed.name === 'string' &&
      typeof parsed.avatar === 'string' &&
      parsed.loggedIn === true
    ) {
      return {
        email: parsed.email,
        name: parsed.name,
        avatar: parsed.avatar,
        loggedIn: true,
      };
    }
  } catch {
    return null;
  }

  return null;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidDemoEmail(email: string) {
  return email.endsWith(ALLOWED_DOMAIN) && email.length > ALLOWED_DOMAIN.length;
}

function createDemoUser(email: string): AuthUser {
  return {
    email,
    name: 'María García',
    avatar: 'MG',
    loggedIn: true,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedUser = safeParseUser(localStorage.getItem(AUTH_STORAGE_KEY));
    setUser(storedUser);
    setIsLoading(false);
  }, []);

  const login = useCallback((email: string, password: string) => {
    if (typeof window === 'undefined') return false;

    const normalizedEmail = normalizeEmail(email);
    const isValidCredentials = password === DEMO_PASSWORD && isValidDemoEmail(normalizedEmail);

    if (!isValidCredentials) {
      return false;
    }

    const nextUser = createDemoUser(normalizedEmail);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
    return true;
  }, []);

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    setUser(null);
    router.replace('/login');
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      isLoggedIn: Boolean(user?.loggedIn),
      isLoading,
      login,
      logout,
    }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

