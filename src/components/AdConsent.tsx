"use client";
import { useState } from "react";
import { hasAdProvider, hasAdConsent } from "@/lib/adPixels";

export function AdConsent() {
  const [message, setMessage] = useState("");
  const choose = (value: string) => {
    try {
      localStorage.setItem("cc_ad_measure_v1", value);
      window.location.reload();
    } catch { setMessage("선택을 저장하지 못했습니다. 광고 측정은 기본적으로 꺼져 있습니다."); }
  };
  return <section aria-label="선택 광고 측정" className="mx-auto max-w-3xl px-6 py-8">
    <h2 className="font-bold">선택 광고 측정</h2>
    {!hasAdProvider ? <p>현재 연결된 선택 광고 픽셀이 없습니다.</p> : <>
      <p>광고 성과 측정은 선택 사항입니다. 거절해도 이용할 수 있고 여기에서 언제든 변경할 수 있습니다.</p>
      <button type="button" className="mr-4 underline" onClick={() => choose("yes")}>허용</button>
      <button type="button" className="mr-4 underline" onClick={() => choose("no")}>거절</button>
      <button type="button" className="underline" onClick={() => setMessage(hasAdConsent() ? "허용 중입니다." : "허용하지 않았습니다.")}>현재 선택 확인</button>
      <p role="status">{message}</p>
    </>}
  </section>;
}
