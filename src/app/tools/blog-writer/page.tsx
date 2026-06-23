"use client";

// AI 블로그 원고 작성 도구. 로그인 필요(미인증 시 /start). 가입 후 마이페이지/요금에서 진입.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { BlogWriter } from "@/components/BlogWriter";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function BlogWriterPage() {
  const router = useRouter();
  const { isAuthenticated, hydrated } = useAuth();

  useEffect(() => {
    if (hydrated && !isAuthenticated) router.replace("/start");
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated || !isAuthenticated) return null;

  return (
    <>
      <SiteHeader />
      <BlogWriter />
      <SiteFooter />
    </>
  );
}
