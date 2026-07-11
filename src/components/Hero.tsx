"use client";

// Animated hero with an intro "loading" splash that fades out (CSS) and
// reveals the hero. Counts up rank (48 -> 1) and exposure (+320%) while the
// splash is visible, then the hero copy/scene rise in as the splash clears.
// Keyframes live in globals.css.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// Tween a number into an element's textContent with an ease-out curve.
function tween(
  el: HTMLElement | null,
  from: number,
  to: number,
  dur: number,
  delay: number,
) {
  if (!el) return;
  const start = performance.now() + delay;
  function step(now: number) {
    const t = Math.min(1, Math.max(0, (now - start) / dur));
    const e = 1 - Math.pow(1 - t, 3);
    el!.textContent = String(Math.round(from + (to - from) * e));
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

export function Hero() {
  const rankRef = useRef<HTMLSpanElement>(null);
  const expRef = useRef<HTMLSpanElement>(null);
  // Intro splash plays only once per session (null = undecided during hydration).
  const [intro, setIntro] = useState<boolean | null>(null);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem("mb_intro_seen") === "1";
    } catch {
      /* ignore */
    }
    if (seen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time session check
      setIntro(false);
      return;
    }
    try {
      sessionStorage.setItem("mb_intro_seen", "1");
    } catch {
      /* ignore */
    }
    setIntro(true);
  }, []);

  useEffect(() => {
    if (intro !== true) return;
    tween(rankRef.current, 48, 1, 800, 150);
    tween(expRef.current, 0, 320, 900, 200);
  }, [intro]);

  return (
    <>
      {/* ===== LOADER OVERLAY (full-screen, auto fades out) — first visit only ===== */}
      {intro === true && (
      <div
        className="hero-loader"
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 200,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 30,
          background:
            "radial-gradient(120% 95% at 50% 35%,#e6faee 0%,#f2fbf6 55%,#ffffff 100%)",
          animation: "loaderOut 1.6s ease forwards",
        }}
      >
        <div
          className="hero-anim"
          style={{ display: "flex", alignItems: "center", gap: 11, animation: "popIn .6s ease both" }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 13,
              background: "linear-gradient(135deg,#18C06A,#0E8F4E)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 12px 24px rgba(16,150,80,.4)",
            }}
          >
            <span style={{ fontSize: 22 }}>🌱</span>
          </div>
          <span style={{ fontWeight: 800, fontSize: 24, color: "#15301f", letterSpacing: "-.02em" }}>
            마케팅방주
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "28px 40px",
          }}
        >
          {/* climbing bars */}
          <div className="hero-anim" style={{ display: "flex", alignItems: "flex-end", gap: 11, height: 150 }}>
            <div style={{ width: 30, height: 60, borderRadius: "9px 9px 4px 4px", background: "linear-gradient(160deg,#7fe0ab,#1aa55e)", transformOrigin: "bottom", animation: "barGrow .9s cubic-bezier(.2,.8,.2,1) .2s both" }} />
            <div style={{ width: 30, height: 96, borderRadius: "9px 9px 4px 4px", background: "linear-gradient(160deg,#ffc188,#f2701c)", transformOrigin: "bottom", animation: "barGrow .95s cubic-bezier(.2,.8,.2,1) .38s both" }} />
            <div style={{ width: 30, height: 128, borderRadius: "9px 9px 4px 4px", background: "linear-gradient(160deg,#9ec2ff,#2563eb)", transformOrigin: "bottom", animation: "barGrow 1s cubic-bezier(.2,.8,.2,1) .56s both" }} />
            <div style={{ width: 30, height: 150, borderRadius: "9px 9px 4px 4px", background: "linear-gradient(160deg,#c9b3ff,#7c3aed)", transformOrigin: "bottom", animation: "barGrow 1.05s cubic-bezier(.2,.8,.2,1) .74s both" }} />
          </div>
          {/* before -> after rank change */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ textAlign: "center", opacity: 0.65 }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: "#94a89c", marginBottom: 3 }}>기존 순위</div>
                <div style={{ fontWeight: 800, fontSize: 30, color: "#9aa8a0", textDecoration: "line-through", lineHeight: 1 }}>48위</div>
              </div>
              <div className="hero-anim" style={{ fontWeight: 800, fontSize: 24, color: "#10b35f", animation: "drift 1.5s ease-in-out infinite" }}>→</div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: "#0e7a44", marginBottom: 3 }}>마케팅방주 적용 후</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 3, justifyContent: "center" }}>
                  <span ref={rankRef} style={{ fontWeight: 800, fontSize: 46, color: "#0e7a44", lineHeight: 1, letterSpacing: "-.03em" }}>48</span>
                  <span style={{ fontWeight: 800, fontSize: 18, color: "#0e7a44" }}>위</span>
                  <span style={{ fontSize: 24 }}>🏆</span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 11, background: "rgba(24,192,106,.12)" }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: "#0e7a44" }}>노출</span>
              <span style={{ fontWeight: 800, fontSize: 20, color: "#0e7a44" }}>+<span ref={expRef}>0</span>%</span>
              <span style={{ fontWeight: 800, fontSize: 13, color: "#10a356" }}>▲ 47계단 상승</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 9, color: "#4d6657", fontWeight: 700, fontSize: 14 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b35f", animation: "blink 1s infinite" }} />
          매장 데이터를 분석하고 있어요…
        </div>
      </div>
      )}

      {/* ===== HERO ===== */}
      <section
        className={intro === true ? undefined : "no-intro"}
        style={{
          position: "relative",
          width: "100%",
          minHeight: "calc(100svh - 64px)",
          overflow: "hidden",
          background:
            "radial-gradient(120% 95% at 78% 12%,#d9f6e4 0%,#eafaf0 38%,#f3fbf6 70%,#ffffff 100%)",
        }}
      >
        {/* soft color blobs */}
        <div className="hero-anim" style={{ position: "absolute", top: -120, right: -80, width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle,rgba(24,192,106,.30),transparent 65%)", filter: "blur(8px)", animation: "glowPulse 7s ease-in-out infinite" }} />
        <div className="hero-anim" style={{ position: "absolute", bottom: -160, left: -100, width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle,rgba(59,130,246,.20),transparent 65%)", filter: "blur(8px)", animation: "glowPulse 9s ease-in-out infinite" }} />

        {/* hero grid */}
        <div
          style={{
            position: "relative",
            zIndex: 20,
            maxWidth: 1240,
            margin: "0 auto",
            minHeight: "calc(100svh - 64px)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 40,
            padding: "80px clamp(20px,5vw,64px)",
          }}
        >
          {/* left copy */}
          <div style={{ flex: "1 1 420px", minWidth: 0 }}>
            <div className="hero-anim" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 999, background: "rgba(24,192,106,.13)", border: "1px solid rgba(24,192,106,.28)", animation: "rise .7s ease 1.15s both" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b35f", animation: "blink 1.4s infinite" }} />
              <span style={{ fontWeight: 700, fontSize: 13, color: "#0e7a44", letterSpacing: "-.01em" }}>
                소상공인 · 온라인 셀러 · 브랜드사를 위한 셀프 마케팅
              </span>
            </div>
            <h1 className="hero-anim" style={{ margin: "22px 0 0", fontWeight: 800, fontSize: "clamp(34px,5.2vw,62px)", lineHeight: 1.08, letterSpacing: "-.035em", color: "#13251a", textWrap: "balance", animation: "rise .8s ease 1.25s both" }}>
              대행사 없이도
              <br />
              손쉽게{" "}
              <span style={{ background: "linear-gradient(120deg,#16b667,#0b8c4c)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
                마케팅
              </span>
              을
              <br />
              시작하세요
            </h1>
            <p className="hero-anim" style={{ margin: "22px 0 0", fontSize: "clamp(15px,1.5vw,19px)", lineHeight: 1.6, color: "#4d6657", maxWidth: 440, animation: "rise .8s ease 1.35s both" }}>
              상위 노출부터 방문 고객 증가, 판매량 극대화, 광고비 환급까지 — 우리 매장에 필요한 것만 골라 바로 시작하세요.
            </p>
            <div className="hero-anim" style={{ display: "flex", flexWrap: "wrap", gap: 14, marginTop: 34, animation: "rise .8s ease 1.45s both" }}>
              <Link href="/start" style={{ position: "relative", overflow: "hidden", textDecoration: "none", fontWeight: 800, fontSize: 16, color: "#fff", padding: "16px 30px", borderRadius: 14, background: "linear-gradient(135deg,#0b8f52,#065f46)", boxShadow: "0 14px 30px rgba(6,95,70,.38)" }}>
                무료로 시작하기
                <span style={{ position: "absolute", top: 0, left: 0, width: "55%", height: "100%", background: "linear-gradient(90deg,transparent,rgba(255,255,255,.45),transparent)", animation: "sheen 3.4s ease-in-out 2s infinite" }} />
              </Link>
              <a href="#services" style={{ border: "1.5px solid #cfe4d8", textDecoration: "none", fontWeight: 700, fontSize: 16, color: "#1f5a3c", padding: "16px 28px", borderRadius: 14, background: "rgba(255,255,255,.7)" }}>
                서비스 둘러보기 →
              </a>
            </div>
            <div className="hero-anim" style={{ display: "flex", gap: 26, marginTop: 38, animation: "rise .8s ease 1.55s both" }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 24, color: "#0e7a44", letterSpacing: "-.02em" }}>12,800+</div>
                <div style={{ fontSize: 13, color: "#6b8275", fontWeight: 600 }}>함께하는 사장님</div>
              </div>
              <div style={{ width: 1, background: "#d9e7df" }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: 24, color: "#0e7a44", letterSpacing: "-.02em" }}>평균 +180%</div>
                <div style={{ fontSize: 13, color: "#6b8275", fontWeight: 600 }}>매출 성장률</div>
              </div>
            </div>
            <p className="hero-anim" style={{ margin: "10px 0 0", fontSize: 11, color: "#8ba295", animation: "rise .8s ease 1.55s both" }}>
              * 정식 오픈 준비 중의 예시 수치이며, 실측 지표로 순차 교체됩니다.
            </p>
          </div>

          {/* right 3D scene */}
          <div className="hero-anim" aria-hidden="true" style={{ flex: "1 1 420px", minWidth: 0, width: "100%", position: "relative", height: "clamp(380px,46vw,520px)", perspective: 1100, animation: "rise .9s ease 1.3s both" }}>
            {/* glossy 3D bars */}
            <div style={{ position: "absolute", bottom: 34, right: "6%", display: "flex", alignItems: "flex-end", gap: 14, height: 300, transform: "rotateX(6deg) rotateY(-12deg)", transformStyle: "preserve-3d" }}>
              <div style={{ width: 46, height: 120, borderRadius: "13px 13px 6px 6px", background: "linear-gradient(160deg,#7fe0ab,#1aa55e)", boxShadow: "0 18px 30px rgba(16,140,75,.28),inset 0 2px 0 rgba(255,255,255,.5)", transformOrigin: "bottom", animation: "barGrow 1s cubic-bezier(.2,.8,.2,1) both,barBob 3.6s ease-in-out 1.2s infinite" }} />
              <div style={{ width: 46, height: 185, borderRadius: "13px 13px 6px 6px", background: "linear-gradient(160deg,#ffc188,#f2701c)", boxShadow: "0 18px 30px rgba(220,100,20,.28),inset 0 2px 0 rgba(255,255,255,.5)", transformOrigin: "bottom", animation: "barGrow 1.05s cubic-bezier(.2,.8,.2,1) .12s both,barBob 3.6s ease-in-out 1.4s infinite" }} />
              <div style={{ width: 46, height: 250, borderRadius: "13px 13px 6px 6px", background: "linear-gradient(160deg,#9ec2ff,#2563eb)", boxShadow: "0 18px 30px rgba(37,99,235,.28),inset 0 2px 0 rgba(255,255,255,.5)", transformOrigin: "bottom", animation: "barGrow 1.1s cubic-bezier(.2,.8,.2,1) .24s both,barBob 3.4s ease-in-out 1.6s infinite" }} />
              <div style={{ width: 46, height: 300, borderRadius: "13px 13px 6px 6px", background: "linear-gradient(160deg,#c9b3ff,#7c3aed)", boxShadow: "0 18px 34px rgba(124,58,237,.30),inset 0 2px 0 rgba(255,255,255,.55)", transformOrigin: "bottom", animation: "barGrow 1.15s cubic-bezier(.2,.8,.2,1) .36s both,barBob 3.2s ease-in-out 1.8s infinite" }} />
            </div>

            {/* big up arrow */}
            <svg viewBox="0 0 120 160" style={{ position: "absolute", top: "6%", right: "40%", width: 96, height: 128, filter: "drop-shadow(0 14px 22px rgba(16,150,80,.4))", animation: "arrowFloat 3.2s ease-in-out infinite" }}>
              <defs>
                <linearGradient id="ar1" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0" stopColor="#0c8a4a" />
                  <stop offset="1" stopColor="#22d37a" />
                </linearGradient>
              </defs>
              <path d="M60 6 L108 70 L80 70 L80 154 L40 154 L40 70 L12 70 Z" fill="url(#ar1)" />
            </svg>

            {/* floating channel chips */}
            <div style={{ position: "absolute", top: "4%", left: "2%", display: "flex", alignItems: "center", gap: 9, padding: "11px 16px", borderRadius: 16, background: "#fff", boxShadow: "0 16px 34px rgba(20,40,30,.16)", animation: "floatA 5s ease-in-out infinite" }}>
              <span style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,#34d27e,#0e8f4e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>📍</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 13, color: "#1c3326" }}>플레이스</div>
                <div style={{ fontWeight: 700, fontSize: 11, color: "#10a356" }}>상위 노출</div>
              </div>
            </div>
            <div style={{ position: "absolute", top: "40%", left: "-2%", display: "flex", alignItems: "center", gap: 9, padding: "11px 16px", borderRadius: 16, background: "#fff", boxShadow: "0 16px 34px rgba(20,40,30,.16)", animation: "floatB 5.6s ease-in-out .6s infinite" }}>
              <span style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,#ffb05a,#f2701c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🛒</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 13, color: "#1c3326" }}>쇼핑</div>
                <div style={{ fontWeight: 700, fontSize: 11, color: "#ef6a18" }}>판매 극대화</div>
              </div>
            </div>
            <div style={{ position: "absolute", bottom: "18%", left: "8%", display: "flex", alignItems: "center", gap: 9, padding: "11px 16px", borderRadius: 16, background: "#fff", boxShadow: "0 16px 34px rgba(20,40,30,.16)", animation: "floatC 4.6s ease-in-out .3s infinite" }}>
              <span style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,#7eaaff,#2563eb)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>✍️</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 13, color: "#1c3326" }}>블로그</div>
                <div style={{ fontWeight: 700, fontSize: 11, color: "#2f73e6" }}>신뢰도 ↑</div>
              </div>
            </div>

            {/* before -> after rank card */}
            <div style={{ position: "absolute", top: "15%", right: "0%", padding: "16px 18px", borderRadius: 18, background: "#fff", boxShadow: "0 20px 44px rgba(20,40,30,.18)", animation: "floatB 6s ease-in-out .9s infinite" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b35f", animation: "blink 1.3s infinite" }} />
                <span style={{ fontWeight: 700, fontSize: 11, color: "#6b8275" }}>네이버 플레이스 순위</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontWeight: 700, fontSize: 9, color: "#aebbb3", marginBottom: 2, letterSpacing: ".04em" }}>AS-IS</div>
                  <div style={{ fontWeight: 800, fontSize: 23, color: "#aab8b0", textDecoration: "line-through", lineHeight: 1 }}>48위</div>
                </div>
                <span style={{ fontWeight: 800, fontSize: 18, color: "#10b35f", animation: "drift 1.6s ease-in-out infinite" }}>→</span>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontWeight: 700, fontSize: 9, color: "#0e7a44", marginBottom: 2, letterSpacing: ".04em" }}>TO-BE</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                    <span style={{ fontWeight: 800, fontSize: 34, color: "#0e7a44", lineHeight: 1, letterSpacing: "-.02em" }}>1</span>
                    <span style={{ fontWeight: 800, fontSize: 14, color: "#0e7a44" }}>위</span>
                    <span style={{ fontSize: 17 }}>🏆</span>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 9px", borderRadius: 8, background: "rgba(24,192,106,.12)", fontWeight: 800, fontSize: 11, color: "#10a356" }}>▲ 47계단 상승 · 3개월</div>
            </div>

            {/* refund coin */}
            <div style={{ position: "absolute", bottom: "6%", right: "30%", width: 62, height: 62, borderRadius: "50%", background: "linear-gradient(135deg,#ffe08a,#f5a623)", boxShadow: "0 16px 30px rgba(245,166,35,.4),inset 0 2px 0 rgba(255,255,255,.6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 24, color: "#7a4b00", animation: "coinFlip 4s linear infinite" }}>₩</div>
          </div>
        </div>
      </section>
    </>
  );
}
