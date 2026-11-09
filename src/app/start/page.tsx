"use client";

// /start — new/returning branch → onboarding → signup/login.
// All transitions happen within this single screen (no URL navigation between
// steps), driven by local state. A `?service=<slug>` param (set by product
// CTAs) keeps the chosen product visible through the funnel and routes the
// new member to that product's order rows after signup. With `&buy=<row>`
// (a detail page's order button) new visitors skip the story onboarding and
// return to that page with the row's order window open. The store sends
// `?signup=1&next=<path>`: straight to the signup form, then back to `next`.

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { AuthEntry } from "@/components/AuthEntry";
import { Onboarding } from "@/components/Onboarding";
import { SignupForm } from "@/components/SignupForm";
import { LoginForm } from "@/components/LoginForm";
import { pricingHref } from "@/components/ProductDetailBody";
import { COMPANY } from "@/lib/company";
import { getProduct } from "@/lib/products";
import { safeNext } from "@/lib/socialAuth";
import { BUY_PARAM } from "@/components/QuickOrder";

type Stage = "entry" | "onboarding" | "signup" | "login";

function StartFunnel() {
  const searchParamsForStage = useSearchParams();
  // Coming from a store 주문하기: open the signup form right away.
  const [stage, setStage] = useState<Stage>(searchParamsForStage.get("signup") === "1" ? "signup" : "entry");
  const cardRef = useRef<HTMLDivElement>(null);

  // Product carried over from a service-detail CTA (may be absent).
  const searchParams = useSearchParams();
  const service = getProduct(searchParams.get("service") ?? "");
  const buy = searchParams.get(BUY_PARAM);
  // `next`: an internal page to return to (the store's 주문하기); `signup=1` skips the story.
  const next = safeNext(searchParams.get("next"));
  const nextBuy = next ? new URL(next, "https://selfmarketing.ai.kr").searchParams.get(BUY_PARAM) : null;
  const straightToSignup = Boolean(buy) || searchParams.get("signup") === "1";
  const afterHref =
    next ??
    (service
      ? buy
        ? `/services/${service.slug}/?${BUY_PARAM}=${encodeURIComponent(buy)}`
        : pricingHref(service.slug)
      : undefined);

  // Already signed in (e.g. Back after signup, or an old bookmark) → don't
  // greet a member with "처음 이용하시나요?"; send them where they were going.
  const router = useRouter();
  const { isAuthenticated, hydrated } = useAuth();
  useEffect(() => {
    if (hydrated && isAuthenticated) router.replace(afterHref ?? "/mypage");
  }, [hydrated, isAuthenticated, afterHref, router]);

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

        {!service && nextBuy && (
          <div className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900 ring-1 ring-emerald-100">
            주문할 상품: <b>{nextBuy}</b>
            <span className="mt-0.5 block text-xs text-emerald-700">가입하면 바로 이 상품 주문 화면으로 돌아가요.</span>
          </div>
        )}

        {service && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm ring-1 ring-emerald-100">
            <span aria-hidden="true">{service.icon}</span>
            <span className="text-emerald-900">
              선택한 서비스: <b>{service.name}</b>
              {buy && <> · {buy}</>}
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
              onNew={() => setStage(straightToSignup ? "signup" : "onboarding")}
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
            <LoginForm onSwitchToSignup={() => setStage("signup")} afterHref={afterHref} />
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

function StartShell() {
  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <div className="mx-auto w-full max-w-md px-5 py-8">
        <Link href="/" className="mb-8 flex items-center gap-2 font-extrabold text-slate-900">
          <span className="text-xl">🌱</span>
          <span>{COMPANY.serviceName}</span>
        </Link>
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
          <h1 className="text-xl font-extrabold text-slate-900">{COMPANY.serviceName} 무료 가입</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            가입은 무료예요. 네이버 플레이스·블로그·카카오맵·당근·인스타그램 마케팅 상품의 단가를 확인하고, 필요한 것만 캐시로
            바로 주문할 수 있어요. 카카오·네이버 간편가입도 지원해요.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function StartPage() {
  // useSearchParams requires a Suspense boundary for static export. The
  // fallback is what crawlers get (pre-hydration HTML), so it carries real
  // content instead of an empty page.
  return (
    <Suspense fallback={<StartShell />}>
      <StartFunnel />
    </Suspense>
  );
}
