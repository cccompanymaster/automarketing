"use client";

// Admin: 사이트 문의 — inquiries sent from the store/finder forms. Each one
// also arrives by email (notify-admin); mark it 답변 완료 after replying.

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { adminListInquiries, adminMarkInquiry, type AdminInquiry } from "@/lib/inquiry";

function when(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function AdminInquiries() {
  const [rows, setRows] = useState<AdminInquiry[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    adminListInquiries()
      .then(setRows)
      .catch((e: Error) => {
        toast.error(e.message);
        setRows([]);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const mark = async (r: AdminInquiry) => {
    const next = r.status === "new" ? "answered" : "new";
    setBusy(r.id);
    try {
      await adminMarkInquiry(r.id, next);
      setRows((prev) => prev?.map((x) => (x.id === r.id ? { ...x, status: next } : x)) ?? prev);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "처리하지 못했어요.");
    } finally {
      setBusy(null);
    }
  };

  const open = rows?.filter((r) => r.status === "new").length ?? 0;

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <h2 className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-5 py-4 text-base font-bold text-slate-900">
        사이트 문의
        {open > 0 && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">답변 대기 {open}</span>}
      </h2>
      {rows === null ? (
        <p className="px-5 py-6 text-sm text-slate-400">불러오는 중…</p>
      ) : rows.length === 0 ? (
        <p className="px-5 py-6 text-sm text-slate-400">아직 문의가 없어요.</p>
      ) : (
        <ul className="divide-y divide-slate-50">
          {rows.map((r) => (
            <li key={r.id} className={`px-5 py-4 ${r.status === "new" ? "bg-amber-50/40" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-slate-400">
                    <span className="font-bold text-slate-600">{r.code}</span> · {when(r.createdAt)}
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-slate-900">{r.topic}</p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    {r.name} · {r.contact}
                    {r.email && ` · ${r.email}`}
                  </p>
                  {r.source && <p className="mt-0.5 text-xs text-slate-400">유입: {r.source}</p>}
                </div>
                <button
                  type="button"
                  disabled={busy === r.id}
                  onClick={() => void mark(r)}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold disabled:opacity-60 ${
                    r.status === "new" ? "bg-emerald-600 text-white hover:bg-emerald-700" : "border border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {r.status === "new" ? "답변 완료로 표시" : "답변 완료 ✓ (되돌리기)"}
                </button>
              </div>
              <p className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{r.message}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
