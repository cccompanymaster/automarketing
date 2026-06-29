"use client";

// AI 블로그 원고 작성 — 3단계 흐름 (주제 설정 → 아웃라인 구성 → 글쓰기 완료).
// 좌측 입력폼 / 우측 결과 패널. 데모(샘플) 모드로 즉시 동작하며, 생성 API 연결 시
// 자동 전환. 원고 생성은 캐시(1,000)를 차감 (원고 작성 단가와 동일).

import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useWallet } from "@/components/WalletProvider";
import { ChargeModal } from "@/components/ChargeModal";
import { formatCash } from "@/lib/cash";
import {
  BLOG_TONES,
  BLOG_WRITE_COST,
  MAX_KEYWORDS,
  type BlogInput,
  type BlogTone,
  generateArticle,
  generateOutline,
  generateTitles,
  isBlogApiConfigured,
} from "@/lib/blogWriter";

const STEPS = [
  { no: 1, label: "주제 설정" },
  { no: 2, label: "아웃라인 구성" },
  { no: 3, label: "글쓰기 완료" },
];

export function BlogWriter() {
  const { balance, spend, refresh } = useWallet();

  const [step, setStep] = useState(1);
  const [writer, setWriter] = useState("");
  const [topic, setTopic] = useState("");
  const [title, setTitle] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [tone, setTone] = useState<BlogTone>("~해요");
  const [useWeb, setUseWeb] = useState(true);
  const [useImage, setUseImage] = useState(false);

  const [titleIdeas, setTitleIdeas] = useState<string[]>([]);
  const [outline, setOutline] = useState<string[]>([]);
  const [article, setArticle] = useState("");

  const [busy, setBusy] = useState<"" | "titles" | "outline" | "article">("");
  const [chargeOpen, setChargeOpen] = useState(false);

  const input = (): BlogInput => ({
    writer: writer.trim() || undefined,
    topic: topic.trim(),
    title: title.trim() || undefined,
    keywords,
    tone,
    useWeb,
    useImage,
  });

  const addKeyword = (raw: string) => {
    const v = raw.trim().replace(/,$/, "");
    if (!v) return;
    if (keywords.includes(v)) return;
    if (keywords.length >= MAX_KEYWORDS) {
      toast.error(`키워드는 최대 ${MAX_KEYWORDS}개까지 입력할 수 있어요.`);
      return;
    }
    setKeywords([...keywords, v]);
    setDraft("");
  };

  const onKeywordKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === " " || e.key === ",") {
      e.preventDefault();
      addKeyword(draft);
    } else if (e.key === "Backspace" && !draft && keywords.length) {
      setKeywords(keywords.slice(0, -1));
    }
  };

  const requireTopic = () => {
    if (!topic.trim()) {
      toast.error("주제를 입력해 주세요.");
      return false;
    }
    return true;
  };

  const handleTitles = async () => {
    if (!requireTopic()) return;
    setBusy("titles");
    try {
      setTitleIdeas(await generateTitles(input()));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "제목 생성에 실패했어요.");
    } finally {
      setBusy("");
    }
  };

  const handleOutline = async () => {
    if (!requireTopic()) return;
    setBusy("outline");
    try {
      setOutline(await generateOutline(input()));
      setArticle("");
      setStep(2);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "아웃라인 생성에 실패했어요.");
    } finally {
      setBusy("");
    }
  };

  const handleArticle = async () => {
    if (!requireTopic()) return;
    if (balance < BLOG_WRITE_COST) {
      toast.error(`캐시가 부족해요. ${formatCash(BLOG_WRITE_COST)}가 필요합니다.`);
      setChargeOpen(true);
      return;
    }
    setBusy("article");
    try {
      const text = await generateArticle(input(), outline);
      if (isBlogApiConfigured) {
        // Real backend deducts the cost server-side (auth + balance enforced in
        // the Edge Function); just re-sync the balance here. Avoids the client
        // being trusted to charge — and prevents a double charge.
        await refresh();
      } else {
        // Demo mode: no server, so the local stub wallet performs the deduction.
        await spend(BLOG_WRITE_COST, `블로그 원고 - ${title.trim() || topic.trim()}`);
      }
      setArticle(text);
      setStep(3);
      toast.success(`원고가 생성되었어요. ${formatCash(BLOG_WRITE_COST)} 차감.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "원고 생성에 실패했어요.");
    } finally {
      setBusy("");
    }
  };

  const copyArticle = async () => {
    try {
      await navigator.clipboard.writeText(article);
      toast.success("원고를 복사했어요.");
    } catch {
      toast.error("복사에 실패했어요.");
    }
  };

  const downloadArticle = () => {
    const blob = new Blob([article], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(title.trim() || topic.trim() || "blog").slice(0, 30)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="flex-1 bg-slate-50">
      {/* Header + stepper */}
      <div className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <h1 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
            <span aria-hidden="true">📝</span> 블로그 원고 작성
          </h1>
          <ol className="flex items-center gap-2 sm:gap-4">
            {STEPS.map((s, i) => (
              <li key={s.no} className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                      step >= s.no ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {s.no}
                  </span>
                  <div className="hidden sm:block">
                    <p className="text-[11px] font-semibold text-slate-400">Step {s.no}</p>
                    <p
                      className={`text-sm font-bold ${
                        step >= s.no ? "text-slate-800" : "text-slate-400"
                      }`}
                    >
                      {s.label}
                    </p>
                  </div>
                </div>
                {i < STEPS.length - 1 && <span className="h-px w-6 bg-slate-200 sm:w-10" />}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-5 px-5 py-6 lg:grid-cols-12">
        {/* Left — input form */}
        <section className="lg:col-span-5">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <Field label="작성자" count={`${writer.length}자/30자`}>
              <input
                value={writer}
                maxLength={30}
                onChange={(e) => setWriter(e.target.value)}
                placeholder="ex) 홍길동"
                className={inputCls}
              />
            </Field>

            <Field label="주제" required count={`${topic.length}자/30자`}>
              <input
                value={topic}
                maxLength={30}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="ex) 오메가3"
                className={inputCls}
              />
            </Field>

            <Field label="블로그 제목" count={`${title.length}자/50자`}>
              <input
                value={title}
                maxLength={50}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ex) 오메가3의 효능"
                className={inputCls}
              />
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={handleTitles}
                  disabled={busy === "titles"}
                  className={subBtnCls}
                >
                  {busy === "titles" ? "생성 중…" : "AI 추천 제목"} 🔍
                </button>
              </div>
              {titleIdeas.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {titleIdeas.map((t) => (
                    <li key={t}>
                      <button
                        type="button"
                        onClick={() => {
                          setTitle(t);
                          setTitleIdeas([]);
                        }}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-sm text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50"
                      >
                        {t}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Field>

            <Field label="핵심 키워드" count={`최대 ${MAX_KEYWORDS}개`}>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKeywordKey}
                placeholder="키워드 입력 후 엔터 및 스페이스"
                className={inputCls}
              />
              {keywords.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {keywords.map((k) => (
                    <li key={k}>
                      <button
                        type="button"
                        onClick={() => setKeywords(keywords.filter((x) => x !== k))}
                        className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        {k} ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Field>

            <Field label="말투">
              <div className="grid grid-cols-2 gap-2">
                {BLOG_TONES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTone(t)}
                    className={`rounded-xl border py-2.5 text-sm font-semibold transition ${
                      tone === t
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {t} {tone === t ? "✓" : ""}
                  </button>
                ))}
              </div>
            </Field>

            <Toggle
              label="최신 검색정보 활용"
              desc="주제와 관련된 최신 정보를 자동으로 반영해요."
              on={useWeb}
              onToggle={() => setUseWeb((v) => !v)}
            />
            <Toggle
              label="이미지 생성"
              desc="글 내용에 맞는 이미지를 함께 생성해요. (연결 시)"
              on={useImage}
              onToggle={() => setUseImage((v) => !v)}
            />

            {/* Primary action */}
            <div className="mt-5 border-t border-slate-50 pt-4">
              {step < 3 ? (
                step === 1 ? (
                  <button
                    type="button"
                    onClick={handleOutline}
                    disabled={busy === "outline"}
                    className={primaryBtnCls}
                  >
                    {busy === "outline" ? "생성 중…" : "아웃라인 생성"} ✨
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleArticle}
                    disabled={busy === "article"}
                    className={primaryBtnCls}
                  >
                    {busy === "article"
                      ? "원고 작성 중…"
                      : `원고 생성 (${formatCash(BLOG_WRITE_COST)})`}{" "}
                    ✍️
                  </button>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOutline([]);
                    setArticle("");
                  }}
                  className={primaryBtnCls}
                >
                  새로 작성하기
                </button>
              )}
              <p className="mt-2 text-center text-[11px] text-slate-400">
                보유 캐시 {formatCash(balance)} · 원고 1건당 {formatCash(BLOG_WRITE_COST)}
              </p>
            </div>
          </div>
        </section>

        {/* Right — result panel */}
        <section className="lg:col-span-7">
          <div className="flex min-h-[28rem] flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            {!isBlogApiConfigured && (
              <div className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-center text-xs text-amber-700">
                현재 <b>데모(샘플)</b> 모드입니다. 생성 API 연결 시 실제 AI 원고로 자동 전환됩니다.
              </div>
            )}

            {step === 1 && <EmptyState />}

            {step === 2 && (
              <OutlineEditor outline={outline} setOutline={setOutline} onRegenerate={handleOutline} regenerating={busy === "outline"} />
            )}

            {step === 3 && (
              <ArticleView
                article={article}
                setArticle={setArticle}
                onCopy={copyArticle}
                onDownload={downloadArticle}
              />
            )}
          </div>
        </section>
      </div>

      <ChargeModal open={chargeOpen} onClose={() => setChargeOpen(false)} />
    </main>
  );
}

// --- small pieces ----------------------------------------------------------

const inputCls =
  "w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";
const subBtnCls =
  "rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60";
const primaryBtnCls =
  "w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60";

function Field({
  label,
  required,
  count,
  children,
}: {
  label: string;
  required?: boolean;
  count?: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-5">
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-sm font-bold text-slate-800">
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </label>
        {count && <span className="text-[11px] text-slate-400">{count}</span>}
      </div>
      {children}
    </div>
  );
}

function Toggle({
  label,
  desc,
  on,
  onToggle,
}: {
  label: string;
  desc: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-bold text-slate-800">{label}</p>
        <p className="text-xs text-slate-400">{desc}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={onToggle}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-emerald-600" : "bg-slate-200"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`}
        />
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <div className="text-6xl" aria-hidden="true">
        🤖
      </div>
      <p className="mt-5 text-sm leading-relaxed text-slate-400">
        블로그 작성을 위한 기본 정보를 입력해 주세요.
        <br />
        검색엔진에 최적화된 인공지능이 만든 글이 여기에 노출됩니다.
      </p>
    </div>
  );
}

function OutlineEditor({
  outline,
  setOutline,
  onRegenerate,
  regenerating,
}: {
  outline: string[];
  setOutline: (o: string[]) => void;
  onRegenerate: () => void;
  regenerating: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900">아웃라인(목차)</h2>
        <button
          type="button"
          onClick={onRegenerate}
          disabled={regenerating}
          className={subBtnCls}
        >
          {regenerating ? "생성 중…" : "다시 생성"} ↻
        </button>
      </div>
      <p className="mt-1 text-xs text-slate-400">목차를 자유롭게 수정·추가·삭제한 뒤 원고를 생성하세요.</p>
      <ul className="mt-4 space-y-2">
        {outline.map((h, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-500">{i + 1}</span>
            <input
              value={h}
              onChange={(e) => setOutline(outline.map((x, j) => (j === i ? e.target.value : x)))}
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
            />
            <button
              type="button"
              onClick={() => setOutline(outline.filter((_, j) => j !== i))}
              className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100"
              aria-label="삭제"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => setOutline([...outline, ""])}
        className="mt-3 self-start rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50"
      >
        + 목차 추가
      </button>
    </div>
  );
}

function ArticleView({
  article,
  setArticle,
  onCopy,
  onDownload,
}: {
  article: string;
  setArticle: (s: string) => void;
  onCopy: () => void;
  onDownload: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900">완성된 원고</h2>
        <div className="flex gap-2">
          <button type="button" onClick={onCopy} className={subBtnCls}>
            복사
          </button>
          <button type="button" onClick={onDownload} className={subBtnCls}>
            다운로드(.md)
          </button>
        </div>
      </div>
      <textarea
        value={article}
        onChange={(e) => setArticle(e.target.value)}
        className="mt-3 min-h-[24rem] flex-1 resize-y rounded-xl border border-slate-200 p-4 text-sm leading-relaxed text-slate-700 outline-none focus:border-emerald-400"
      />
      <p className="mt-2 text-[11px] text-slate-400">
        마크다운 형식입니다. 직접 수정한 뒤 복사하거나 다운로드할 수 있어요.
      </p>
    </div>
  );
}
