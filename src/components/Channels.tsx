// Supported advertising / exposure channels, shown as an auto-scrolling logo
// banner (brand marks, no third-party logo assets).

import { Marquee } from "@/components/Marquee";
import { BrandMark, CHANNEL_MARKS } from "@/components/BrandMark";

export function Channels() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-2xl px-5 text-center">
        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          주요 광고 · 노출 매체
        </h2>
        <p className="mt-3 text-sm text-slate-600 sm:text-base">
          소비자가 가장 많이 쓰는 채널에 우리 매장을 노출합니다.
        </p>
      </div>

      <Marquee durationSec={16} className="mt-10 [--marquee-gap:3.5rem]">
        {CHANNEL_MARKS.map((k) => (
          <span key={k} className="flex items-center">
            <BrandMark k={k} />
          </span>
        ))}
      </Marquee>
    </section>
  );
}
