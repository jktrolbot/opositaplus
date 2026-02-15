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
import type { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import {
  canAccess as canRoleAccess,
  getUserRole,
  isAdmin as hasAdminRole,
  type AppRole,
  type AuthAction,
  type AuthResource,
} from '@/lib/auth/roles';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
  role: AppRole | null;
  loggedIn: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  session: Session | null;
  role: AppRole | null;
  isAdmin: boolean;
  canAccess: (resource: AuthResource, action?: AuthAction) => boolean;
  isLoggedIn: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: string | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  /** @deprecated Use signIn instead */
  login: (email: string, password: string) => boolean;
  /** @deprecated Use signOut instead */
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function userFromSupabase(user: User): Promise<AuthUser> {
  const email = user.email ?? '';
  const name = user.user_metadata?.full_name ?? user.user_metadata?.name ?? email.split('@')[0] ?? '';
  const initials = name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';
  const supabase = createClient();
  const role = await getUserRole(supabase, user.id);
  return {
    id: user.id,
    email,
    name,
    avatar: initials,
    role,
    loggedIn: true,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

    const syncSession = async (nextSession: Session | null) => {
      if (!isMounted) return;
      setSession(nextSession);

      if (!nextSession?.user) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const normalizedUser = await userFromSupabase(nextSession.user);
      if (!isMounted) return;
      setUser(normalizedUser);
      setIsLoading(false);
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      void syncSession(s);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      void syncSession(s);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) return { error: error.message };
    router.refresh();
    return { error: null };
  }, [router]);

  const signUp = useCallback(async (email: string, password: string, name?: string) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const signInWithMagicLink = useCallback(async (email: string) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    router.replace('/login');
  }, [router]);

  // Legacy compat
  const login = useCallback((email: string, password: string) => {
    signIn(email, password);
    return true;
  }, [signIn]);

  const logout = useCallback(() => {
    signOut();
  }, [signOut]);

  const value = useMemo(
    () => ({
      user,
      session,
      role: user?.role ?? null,
      isAdmin: hasAdminRole(user?.role),
      canAccess: (resource: AuthResource, action: AuthAction = 'read') =>
        canRoleAccess(resource, action, user?.role),
      isLoggedIn: Boolean(user?.loggedIn),
      isLoading,
      signIn,
      signUp,
      signInWithMagicLink,
      signOut,
      login,
      logout,
    }),
    [user, session, isLoading, signIn, signUp, signInWithMagicLink, signOut, login, logout],
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
