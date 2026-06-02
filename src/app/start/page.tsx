"use client";

// /start — new/returning branch → onboarding → signup/login.
// All transitions happen within this single screen (no URL navigation between
// steps), driven by local state.

import { useState } from "react";
import Link from "next/link";
import { AuthEntry } from "@/components/AuthEntry";
import { Onboarding } from "@/components/Onboarding";
import { SignupForm } from "@/components/SignupForm";
import { LoginForm } from "@/components/LoginForm";
import { COMPANY } from "@/lib/company";

type Stage = "entry" | "onboarding" | "signup" | "login";

export default function StartPage() {
  const [stage, setStage] = useState<Stage>("entry");

  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 py-8">
        <Link
          href="/"
          className="mb-8 flex items-center gap-2 font-extrabold text-slate-900"
        >
          <span className="text-xl">🌱</span>
          <span>{COMPANY.serviceName}</span>
        </Link>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
          {stage === "entry" && (
            <AuthEntry
              onNew={() => setStage("onboarding")}
              onReturning={() => setStage("login")}
            />
          )}

          {stage === "onboarding" && (
            <Onboarding onComplete={() => setStage("signup")} />
          )}

          {stage === "signup" && (
            <SignupForm onSwitchToLogin={() => setStage("login")} />
          )}

          {stage === "login" && (
            <LoginForm onSwitchToSignup={() => setStage("signup")} />
          )}
        </div>

        {stage !== "entry" && (
          <button
            type="button"
            onClick={() => setStage("entry")}
            className="mt-6 text-center text-sm text-slate-400 transition hover:text-slate-600"
          >
            ← 처음으로
          </button>
        )}
      </div>
    </main>
  );
}
