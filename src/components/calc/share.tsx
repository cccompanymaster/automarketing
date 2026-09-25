"use client";

// Share tools for calculators whose inputs are not personal data.
// - useUrlInputs: restores whitelisted inputs from the query string once after
//   mount, and builds a share URL containing only those keys.
// - ShareBar: copy link, KakaoTalk share (when NEXT_PUBLIC_KAKAO_JS_KEY is set,
//   otherwise the OS share sheet / copy fallback), and a note listing exactly
//   which inputs go into the link.
// Never use this for payslips, contracts or anything with names/wages of a
// specific person.

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Keep `state` in sync with whitelisted URL params. Only string values are
 * shared; `keys` is the allowlist.
 */
export function useUrlInputs<S extends Record<string, string>>(
  state: S,
  setState: (updater: (prev: S) => S) => void,
  keys: (keyof S & string)[],
) {
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const q = new URLSearchParams(window.location.search);
    const patch: Partial<S> = {};
    for (const k of keys) {
      const v = q.get(k);
      if (v != null && v.length <= 40) patch[k] = v as S[typeof k];
    }
    if (Object.keys(patch).length) setState((prev) => ({ ...prev, ...patch }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return useCallback(() => {
    const url = new URL(window.location.href);
    url.search = "";
    url.hash = "";
    for (const k of keys) {
      const v = state[k];
      if (v !== "" && v != null) url.searchParams.set(k, v);
    }
    return url.toString();
  }, [state, keys]);
}

const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

interface KakaoSdk {
  isInitialized(): boolean;
  init(key: string): void;
  Share: { sendDefault(opts: unknown): void };
}

function loadKakao(): Promise<KakaoSdk | null> {
  if (!KAKAO_KEY) return Promise.resolve(null);
  const w = window as unknown as { Kakao?: KakaoSdk };
  if (w.Kakao) return Promise.resolve(w.Kakao);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js";
    s.async = true;
    s.onload = () => resolve(w.Kakao ?? null);
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
  });
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers: hidden textarea + execCommand.
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export function ShareBar({
  title,
  description,
  buildUrl,
  sharedFields,
}: {
  title: string;
  /** Short result summary used as the share text. */
  description: string;
  /** Returns the URL to share (with whitelisted inputs). */
  buildUrl: () => string;
  /** Labels of the inputs included in the link, shown to the user. */
  sharedFields: string[];
}) {
  const [canNativeShare, setCanNativeShare] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- feature detection after mount
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  const copy = async () => {
    const ok = await copyText(buildUrl());
    if (ok) toast.success("결과 링크를 복사했어요.");
    else toast.error("복사하지 못했어요. 주소창의 링크를 직접 복사해 주세요.");
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title, text: description, url: buildUrl() });
    } catch {
      /* user cancelled */
    }
  };

  const kakao = async () => {
    const url = buildUrl();
    const sdk = await loadKakao();
    if (sdk) {
      try {
        if (!sdk.isInitialized()) sdk.init(KAKAO_KEY!);
        const origin = window.location.origin;
        sdk.Share.sendDefault({
          objectType: "feed",
          content: {
            title,
            description,
            imageUrl: `${origin}${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/og.png`,
            link: { webUrl: url, mobileWebUrl: url },
          },
          buttons: [{ title: "결과 보기", link: { webUrl: url, mobileWebUrl: url } }],
        });
        return;
      } catch {
        /* fall through */
      }
    }
    if (canNativeShare) return nativeShare();
    const ok = await copyText(`${title}\n${description}\n${url}`);
    toast.success(ok ? "링크를 복사했어요. 카카오톡 대화창에 붙여넣어 보내세요." : "공유하지 못했어요.");
  };

  const btn =
    "flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={copy} className={`${btn} border border-slate-200 text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-400`}>
          🔗 결과 링크 복사
        </button>
        <button type="button" onClick={kakao} className={`${btn} bg-[#FEE500] text-black/85 hover:brightness-95 focus-visible:ring-yellow-500`}>
          💬 카카오톡 공유
        </button>
        {canNativeShare && (
          <button type="button" onClick={nativeShare} className={`${btn} border border-slate-200 text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-400`}>
            📤 다른 앱으로 공유
          </button>
        )}
      </div>
      <p className="mt-2.5 text-[11px] leading-relaxed text-slate-400">
        공유 링크에는 다음 입력값이 들어가요: {sharedFields.join(", ")}. 이름·연락처 같은 개인정보는 포함되지 않아요.
      </p>
    </div>
  );
}
