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
import { koreanAuthError } from "@/lib/authErrors";
import {
  SOCIAL_PROVIDERS,
  socialProviderFromSupabase,
  type SocialProvider,
} from "@/lib/socialAuth";

/** Consent snapshot captured at signup (audit trail for 제3자 제공 동의). */
export interface ConsentRecord {
  terms: boolean;
  privacy: boolean;
  /** 제3자 정보제공 (선택) — DB 제공·판매의 법적 근거. */
  thirdParty: boolean;
  /** 마케팅 정보 수신 (선택). */
  marketing: boolean;
  /** ISO timestamp of the agreement. */
  agreedAt: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  provider: "email" | SocialProvider;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  /** False until the session has been restored on the client. */
  hydrated: boolean;
  loginWithEmail: (email: string, password: string) => Promise<User>;
  signupWithEmail: (
    email: string,
    password: string,
    name?: string,
    consents?: ConsentRecord,
  ) => Promise<User>;
  /** Redirects to the provider (real mode); returns a fake session in stub mode. */
  loginWithSocial: (provider: SocialProvider) => Promise<User>;
  /** Emails a reset link that lands on /auth/reset. */
  sendPasswordReset: (email: string) => Promise<void>;
  /** Sets a new password for the signed-in (or recovering) member. */
  updatePassword: (password: string) => Promise<void>;
  logout: () => void;
}

const STORAGE_KEY = "selfmarketing.auth.user";

/**
 * Thrown by signupWithEmail when Supabase accepts the signup but requires the
 * user to confirm their email before a session exists. This is a SUCCESS path,
 * not a failure — callers should show a "check your inbox" notice, not an error.
 */
export class EmailConfirmationRequiredError extends Error {
  constructor(message = "확인 메일을 보냈어요. 메일의 링크로 인증을 완료해 주세요.") {
    super(message);
    this.name = "EmailConfirmationRequiredError";
  }
}

/**
 * Thrown by signupWithEmail when the email already has an account. Supabase
 * answers such a signup with a fake success (anti-enumeration) and sends no
 * mail, so without this the form would tell the member to wait for an email
 * that never comes.
 */
export class EmailAlreadyRegisteredError extends Error {
  constructor(message = "이미 가입된 이메일이에요. 로그인해 주세요.") {
    super(message);
    this.name = "EmailAlreadyRegisteredError";
  }
}

/**
 * Absolute site root for auth redirects. SITE_URL carries the GitHub Pages
 * base path when there is one; window.location.origin alone would drop it.
 */
function siteRoot(): string {
  const root =
    process.env.NEXT_PUBLIC_SITE_URL ??
    `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}`;
  return root.replace(/\/$/, "");
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapSupabaseUser(u: SupabaseUser): User {
  const provider = socialProviderFromSupabase(u.app_metadata?.provider as string) ?? "email";
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
        if (error) throw new Error(koreanAuthError(error.message));
        return mapSupabaseUser(data.user);
      }
      const next: User = { id: email, email, provider: "email" };
      persistStub(next);
      return next;
    },
    [supabase, persistStub],
  );

  const signupWithEmail = useCallback(
    async (
      email: string,
      password: string,
      name?: string,
      consents?: ConsentRecord,
    ): Promise<User> => {
      if (supabase) {
        // Consents ride along in user_metadata so they survive email
        // confirmation (no session yet, so consent_logs can't be written here);
        // ConsentGate copies them into the audit table on first login.
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name, consents } },
        });
        if (error) throw new Error(koreanAuthError(error.message));
        // An existing account comes back as a user with no identities.
        if (data.user && (data.user.identities?.length ?? 0) === 0) {
          throw new EmailAlreadyRegisteredError();
        }
        if (!data.session || !data.user) {
          // Email confirmation required (configurable in Supabase). Surfaced as
          // a dedicated success notice by the signup form, not an error toast.
          throw new EmailConfirmationRequiredError();
        }
        // Append the auditable consent record. Best-effort: a failure here must
        // not undo a successful signup (the metadata copy above still stands).
        if (consents) {
          try {
            const { recordConsents } = await import("@/lib/consents");
            await recordConsents(consents, "signup", data.user.id);
          } catch {
            /* ignore */
          }
        }
        return mapSupabaseUser(data.user);
      }
      const next: User = { id: email, email, name, provider: "email" };
      persistStub(next);
      // Stub mode: keep the consent snapshot alongside the local session.
      if (consents) {
        try {
          localStorage.setItem(`${STORAGE_KEY}.consents`, JSON.stringify(consents));
        } catch {
          /* ignore */
        }
      }
      return next;
    },
    [supabase, persistStub],
  );

  const loginWithSocial = useCallback(
    async (provider: SocialProvider): Promise<User> => {
      if (supabase) {
        // Land on the callback page, which forwards to the stashed destination.
        const { error } = await supabase.auth.signInWithOAuth({
          // Custom providers ("custom:naver") aren't in supabase-js's Provider union.
          provider: SOCIAL_PROVIDERS[provider].supabaseId as "kakao",
          options: { redirectTo: `${siteRoot()}/auth/callback/` },
        });
        if (error) throw new Error(koreanAuthError(error.message));
        // OAuth redirects away; the returned value is unused.
        return { id: provider, email: "", provider };
      }
      // Stub mode: fake a session so the demo flow can continue.
      const next: User = { id: `${provider}-user`, email: `${provider}-user@example.com`, provider };
      persistStub(next);
      return next;
    },
    [supabase, persistStub],
  );

  const sendPasswordReset = useCallback(
    async (email: string): Promise<void> => {
      if (!supabase) return; // Stub mode: nothing to send.
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteRoot()}/auth/reset/`,
      });
      if (error) throw new Error(koreanAuthError(error.message));
    },
    [supabase],
  );

  const updatePassword = useCallback(
    async (password: string): Promise<void> => {
      if (!supabase) return;
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw new Error(koreanAuthError(error.message));
    },
    [supabase],
  );

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
      loginWithSocial,
      sendPasswordReset,
      updatePassword,
      logout,
    }),
    [
      user,
      hydrated,
      loginWithEmail,
      signupWithEmail,
      loginWithSocial,
      sendPasswordReset,
      updatePassword,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
