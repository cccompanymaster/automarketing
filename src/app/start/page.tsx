"use client";

// /start — new/returning branch → onboarding → signup/login.
// All transitions happen within this single screen (no URL navigation between
// steps), driven by local state. A `?service=<slug>` param (set by product
// CTAs) keeps the chosen product visible through the funnel and routes the
// new member to that product's order rows after signup.

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthEntry } from "@/components/AuthEntry";
import { Onboarding } from "@/components/Onboarding";
import { SignupForm } from "@/components/SignupForm";
import { LoginForm } from "@/components/LoginForm";
import { pricingHref } from "@/components/ProductDetailBody";
import { COMPANY } from "@/lib/company";
import { getProduct } from "@/lib/products";

type Stage = "entry" | "onboarding" | "signup" | "login";

function StartFunnel() {
  const [stage, setStage] = useState<Stage>("entry");
  const cardRef = useRef<HTMLDivElement>(null);

  // Product carried over from a service-detail CTA (may be absent).
  const searchParams = useSearchParams();
  const service = getProduct(searchParams.get("service") ?? "");
  const afterHref = service ? pricingHref(service.slug) : undefined;

  // Long forms on mobile: snap back to the top whenever the stage changes,
  // and move keyboard focus onto the new step so it isn't dropped on BODY.
  useEffect(() => {
    window.scrollTo({ top: 0 });
    cardRef.current?.focus({ preventScroll: true });
  }, [stage]);

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

        {service && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm ring-1 ring-emerald-100">
            <span aria-hidden="true">{service.icon}</span>
            <span className="text-emerald-900">
              선택한 서비스: <b>{service.name}</b>
            </span>
          </div>
        )}

        <div
          ref={cardRef}
          tabIndex={-1}
          className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 outline-none sm:p-8"
        >
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
            <SignupForm onSwitchToLogin={() => setStage("login")} afterHref={afterHref} />
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

export default function StartPage() {
  // useSearchParams requires a Suspense boundary for static export.
  return (
    <Suspense fallback={null}>
      <StartFunnel />
    </Suspense>
  );
}
