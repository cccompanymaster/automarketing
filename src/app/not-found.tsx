import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-5 py-24">
        <div className="text-center">
          <p className="text-5xl" aria-hidden="true">
            🔍
          </p>
          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            페이지를 찾을 수 없습니다
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            주소가 잘못되었거나 삭제된 페이지입니다.
          </p>
          <Link
            href="/"
            className="mt-7 inline-block rounded-xl bg-emerald-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
