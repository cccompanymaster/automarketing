// Supported advertising / exposure channels as a static row of brand marks
// (no third-party logo assets). Static rather than a marquee: all ten are
// visible at once, nothing is cropped at the edges, and there is no motion
// to pause.

import { BrandMark, CHANNEL_MARKS } from "@/components/BrandMark";

export function Channels() {
  return (
    <div className="mt-14 flex flex-col gap-5 border-t border-mint-200 pt-8 lg:flex-row lg:items-center lg:gap-10">
      <h3 className="shrink-0 text-[15px] font-bold text-forest-900">이 채널에 노출해요</h3>
      <ul className="flex flex-wrap items-center gap-x-8 gap-y-4" aria-label="노출 채널">
        {CHANNEL_MARKS.map((k) => (
          <li key={k} className="flex items-center">
            <BrandMark k={k} />
          </li>
        ))}
      </ul>
    </div>
  );
}
