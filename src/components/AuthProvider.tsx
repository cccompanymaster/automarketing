"use client";

// Client-side auth context holding login state + basic user info.
// All auth operations are STUBS. No real credentials are validated and no
// tokens are exchanged.
// TODO(backend): replace stub methods with real auth API + session handling.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface User {
  email: string;
  name?: string;
  /** Which method created the session (for display only). */
  provider: "email" | "kakao";
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  /**
   * False until the stored session has been restored on the client.
   * Consumers that redirect unauthenticated users (e.g. /mypage) must wait
   * for this to avoid bouncing a logged-in user during hydration.
   */
  hydrated: boolean;
  /** Stub email login. Always "succeeds" for any input. */
  loginWithEmail: (email: string, password: string) => Promise<User>;
  /** Stub email signup. */
  signupWithEmail: (email: string, password: string, name?: string) => Promise<User>;
  /** Stub Kakao login/signup. */
  loginWithKakao: () => Promise<User>;
  logout: () => void;
}

const STORAGE_KEY = "selfmarketing.auth.user";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Restore a previously stored stub session on mount. Kept in an effect (not a
  // lazy initializer) to avoid SSR/hydration mismatch since localStorage is
  // client-only.
  useEffect(() => {
    let restored: User | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) restored = JSON.parse(raw) as User;
    } catch {
      // ignore malformed storage
    }
    if (restored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration of client-only storage
      setUser(restored);
    }
    setHydrated(true);
  }, []);

  const persist = useCallback((next: User | null) => {
    setUser(next);
    try {
      if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore storage failures (e.g. private mode)
    }
  }, []);

  const loginWithEmail = useCallback(
    async (email: string, _password: string): Promise<User> => {
      // TODO(backend): exchange credentials for a real session.
      const next: User = { email, provider: "email" };
      persist(next);
      return next;
    },
    [persist],
  );

  const signupWithEmail = useCallback(
    async (email: string, _password: string, name?: string): Promise<User> => {
      // TODO(backend): create account via real signup API.
      const next: User = { email, name, provider: "email" };
      persist(next);
      return next;
    },
    [persist],
  );

  const loginWithKakao = useCallback(async (): Promise<User> => {
    // TODO(backend): implement real Kakao OAuth token exchange.
    console.log("[auth:stub] Kakao login flow (stub)");
    const next: User = { email: "kakao-user@example.com", provider: "kakao" };
    persist(next);
    return next;
  }, [persist]);

  const logout = useCallback(() => {
    persist(null);
  }, [persist]);

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
