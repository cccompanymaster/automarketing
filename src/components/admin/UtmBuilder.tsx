"use client";

// UTM 링크 만들기: pick the page and the channel, name the campaign, copy the
// link. Source/medium come from the fixed channel list (lib/utm) so GA4
// groups every link the same way.

import { useState } from "react";
import { toast } from "sonner";
import { UTM_CHANNELS, buildUtmUrl } from "@/lib/utm";

const SITE = "https://selfmarketing.ai.kr";
const PAGES = [
  { label: "홈", path: "/" },
  { label: "상품 스토어", path: "/pricing/" },
  { label: "무료 계산기", path: "/tools/" },
  { label: "AI 원고", path: "/tools/blog-writer/" },
  { label: "자주 묻는 질문", path: "/faq/" },
  { label: "회원가입", path: "/start/" },
];

const field = "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500";

export function UtmBuilder() {
  const [page, setPage] = useState("/pricing/");
  const [custom, setCustom] = useState("");
  const [channel, setChannel] = useState("naver_blog");
  const [campaign, setCampaign] = useState("");
  const [content, setContent] = useState("");
  const base = custom.trim() ? (custom.trim().startsWith("http") ? custom.trim() : `${SITE}${custom.trim().startsWith("/") ? "" : "/"}${custom.trim()}`) : `${SITE}${page}`;
  const url = buildUtmUrl(base, channel, campaign, content);

  const copy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("링크를 복사했어요.");
    } catch {
      toast.error("복사하지 못했어요. 링크를 길게 눌러 복사해 주세요.");
    }
  };

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 sm:p-5">
      <h2 className="text-sm font-extrabold text-slate-900">UTM 링크 만들기</h2>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">
        블로그·카톡·당근·문자에 거는 링크를 이걸로 만들면 GA4 → 보고서 → 획득 → 트래픽 획득에서 어느 채널로 손님이 왔는지 나뉘어 보여요.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold text-slate-600">
          연결할 페이지
          <select value={page} onChange={(e) => setPage(e.target.value)} className={`${field} mt-1`} disabled={!!custom.trim()}>
            {PAGES.map((p) => (
              <option key={p.path} value={p.path}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600">
          또는 직접 입력 (선택)
          <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="/store/blog-deploy/" className={`${field} mt-1`} />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          링크를 걸 곳 (채널)
          <select value={channel} onChange={(e) => setChannel(e.target.value)} className={`${field} mt-1`}>
            {UTM_CHANNELS.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600">
          캠페인 이름 *
          <input value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="예: 2026-11_원고500원" className={`${field} mt-1`} />
        </label>
        <label className="text-xs font-semibold text-slate-600 sm:col-span-2">
          구분 (선택 — 같은 글 안 링크 여러 개일 때)
          <input value={content} onChange={(e) => setContent(e.target.value)} placeholder="예: 상단배너 / 본문링크" className={`${field} mt-1`} />
        </label>
      </div>
      <div className="mt-3 rounded-xl bg-slate-50 p-3">
        <p className="break-all text-xs text-slate-700">{url ?? "캠페인 이름을 넣으면 링크가 만들어져요."}</p>
        <button
          type="button"
          onClick={() => void copy()}
          disabled={!url}
          className="mt-2 h-9 rounded-lg bg-emerald-600 px-4 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-40"
        >
          링크 복사
        </button>
      </div>
    </section>
  );
}
