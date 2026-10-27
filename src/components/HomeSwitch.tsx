"use client";

// "/" shows the guest landing (also what crawlers get) or, once a member's
// session is restored, the member home. The <head> script in layout.tsx sets
// html.is-member before paint when a session is stored, hiding the landing
// so members don't see it flash.

import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider";
import { MemberHome } from "@/components/MemberHome";

export function HomeSwitch({ children }: { children: ReactNode }) {
  const { hydrated, isAuthenticated } = useAuth();

  useEffect(() => {
    if (hydrated) document.documentElement.classList.toggle("is-member", isAuthenticated);
  }, [hydrated, isAuthenticated]);

  if (hydrated && isAuthenticated) return <MemberHome />;
  return (
    <div data-guest-only className="flex flex-1 flex-col">
      {children}
    </div>
  );
}
