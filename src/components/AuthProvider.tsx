"use client";

// Client auth context. Uses real Supabase auth when configured
// (NEXT_PUBLIC_SUPABASE_URL + ANON_KEY); otherwise falls back to a local
// localStorage stub so the app stays fully usable with no backend.
// TODO(backend): enable Supabase by setting env keys (no code change needed).

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";

export interface User {
  id: string;
  email: string;
  name?: string;
  provider: "email" | "kakao";
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  /** False until the session has been restored on the client. */
  hydrated: boolean;
  loginWithEmail: (email: string, password: string) => Promise<User>;
  signupWithEmail: (email: string, password: string, name?: string) => Promise<User>;
  loginWithKakao: () => Promise<User>;
  logout: () => void;
}

const STORAGE_KEY = "selfmarketing.auth.user";

const AuthContext = createContext<AuthContextValue | null>(null);

function mapSupabaseUser(u: SupabaseUser): User {
  const provider = (u.app_metadata?.provider as string) === "kakao" ? "kakao" : "email";
  return {
    id: u.id,
    email: u.email ?? "",
    name: (u.user_metadata?.name as string | undefined) ?? undefined,
    provider,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = getSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Restore session on mount (Supabase session or local stub).
  useEffect(() => {
    let active = true;

    if (supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (!active) return;
        setUser(data.session ? mapSupabaseUser(data.session.user) : null);
        setHydrated(true);
      });
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session ? mapSupabaseUser(session.user) : null);
      });
      return () => {
        active = false;
        sub.subscription.unsubscribe();
      };
    }

    // Stub mode
    let restored: User | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) restored = JSON.parse(raw) as User;
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time stub hydration
    if (restored) setUser(restored);
    setHydrated(true);
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistStub = useCallback((next: User | null) => {
    setUser(next);
    try {
      if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const loginWithEmail = useCallback(
    async (email: string, password: string): Promise<User> => {
      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message);
        return mapSupabaseUser(data.user);
      }
      const next: User = { id: email, email, provider: "email" };
      persistStub(next);
      return next;
    },
    [supabase, persistStub],
  );

  const signupWithEmail = useCallback(
    async (email: string, password: string, name?: string): Promise<User> => {
      if (supabase) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });
        if (error) throw new Error(error.message);
        if (!data.session || !data.user) {
          // Email confirmation required (configurable in Supabase).
          throw new Error("확인 메일을 보냈어요. 메일의 링크로 인증을 완료해 주세요.");
        }
        return mapSupabaseUser(data.user);
      }
      const next: User = { id: email, email, name, provider: "email" };
      persistStub(next);
      return next;
    },
    [supabase, persistStub],
  );

  const loginWithKakao = useCallback(async (): Promise<User> => {
    if (supabase) {
      // Requires Kakao provider enabled in Supabase Auth.
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: { redirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
      });
      if (error) throw new Error(error.message);
      // OAuth redirects away; the returned value is unused.
      return { id: "kakao", email: "", provider: "kakao" };
    }
    // TODO(backend): real Kakao OAuth. Stub credits a fake session.
    const next: User = { id: "kakao-user", email: "kakao-user@example.com", provider: "kakao" };
    persistStub(next);
    return next;
  }, [supabase, persistStub]);

  const logout = useCallback(() => {
    if (supabase) {
      void supabase.auth.signOut();
      return;
    }
    persistStub(null);
  }, [supabase, persistStub]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      hydrated,
      loginWithEmail,
      signupWithEmail,
      loginWithKakao,
      logout,
    }),
    [user, hydrated, loginWithEmail, signupWithEmail, loginWithKakao, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
