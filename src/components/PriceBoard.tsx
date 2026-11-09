// Hero price board — the landing's signature object. Mirrors what sets the
// service apart from an agency quote: the price is on the wall before anyone
// asks. Every row is a real product with its real "from" price, read from the
// same catalog as the service cards (LANDING_CARDS), so the board can never
// drift from the store. Rows link to the product page.

import { LANDING_CARDS, isPriceAmount, type ProductSlug } from "@/lib/products";
import { PRICING } from "@/lib/pricing";
import { storeProducts } from "@/lib/store";
import { TrackedCta } from "@/components/TrackedCta";

type BoardRow = { name: string; href: string; price: string; trackId: string };

/** Landing cards flattened: group cards expand into their member products. */
function catalogRows(): Map<string, BoardRow> {
  const rows = new Map<string, BoardRow>();
  for (const card of LANDING_CARDS) {
    if (card.includes) {
      for (const it of card.includes) {
        if (it.price && isPriceAmount(it.price)) {
          rows.set(it.name, { name: it.name, href: it.href, price: it.price, trackId: card.trackId });
        }
      }
    } else if (card.price?.from) {
      rows.set(card.name, { name: card.name, href: card.href, price: card.price.amount, trackId: card.trackId });
    }
  }
  return rows;
}

// What the board shows, in order, with the channel each product works on.
// Names must match the catalog; a renamed product simply drops off the board.
const PICKS: { name: string; channel: string }[] = [
  { name: "플레이스 상위노출", channel: "네이버 지도" },
  { name: "블로그 1페이지 점령", channel: "네이버 블로그" },
  { name: "커머스 상위노출", channel: "네이버 쇼핑" },
  { name: "카카오맵 평판 굳히기", channel: "카카오맵" },
  { name: "인스타 인기몰이", channel: "인스타그램" },
  { name: "유튜브 채널 키우기", channel: "유튜브" },
  { name: "뉴스에 우리 가게 띄우기", channel: "언론보도" },
];

const storeCount = storeProducts(PRICING).length;

export function PriceBoard() {
  const catalog = catalogRows();
  const rows = PICKS.flatMap((p) => {
    const row = catalog.get(p.name);
    return row ? [{ ...row, channel: p.channel }] : [];
  });

  return (
    <div className="relative">
      {/* Sticker: the one loud mark on the page. */}
      <p
        className="absolute -right-2 -top-7 z-10 flex h-24 w-24 rotate-[8deg] items-center justify-center rounded-full bg-tag text-center text-[13px] font-extrabold leading-tight text-forest-900 shadow-[0_6px_14px_-4px_rgba(14,42,31,0.35)] sm:-right-5 sm:h-28 sm:w-28 sm:text-[15px]"
      >
        가입 전에도
        <br />
        다 보여요
      </p>

      <nav
        aria-label="상품별 시작 가격"
        className="relative overflow-hidden rounded-[1.75rem] border border-mint-200 bg-white shadow-[0_30px_60px_-30px_rgba(14,42,31,0.35)]"
      >
        <div className="border-b border-mint-200 px-6 pb-4 pt-6 sm:px-8">
          <p className="text-lg font-extrabold tracking-tight text-forest-900">마케팅방주 가격표</p>
        </div>

        <ul className="px-3 py-2 sm:px-5">
          {rows.map((r, i) => (
            <li
              key={r.name}
              className={`pb-row ${i >= 5 ? "hidden sm:block" : ""}`}
              style={{ "--i": i } as React.CSSProperties}
            >
              <TrackedCta
                href={r.href}
                slug={r.trackId as ProductSlug}
                className="group flex items-center gap-3 rounded-2xl px-3 py-3.5 transition-colors hover:bg-mint-50 focus-visible:bg-mint-50 sm:py-4"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-bold text-forest-900 sm:text-base">{r.name}</span>
                  <span className="block text-xs text-slate-500">{r.channel}</span>
                </span>
                {/* Menu-board leader between name and price. */}
                <span
                  aria-hidden="true"
                  className="h-0 min-w-4 flex-1 self-center border-b-2 border-dotted border-mint-200 transition-colors group-hover:border-emerald-300"
                />
                <span className="price-tag text-[15px] sm:text-base">
                  {r.price}
                  <small>부터</small>
                </span>
              </TrackedCta>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-mint-200 bg-mint-50 px-6 py-4 sm:px-8">
          <p className="text-xs leading-relaxed text-slate-600">1건 단가, 부가세 별도예요. 상품마다 최소 주문 수량이 달라요.</p>
          <TrackedCta
            href="/pricing/"
            className="text-sm font-bold text-emerald-800 underline decoration-emerald-800/30 underline-offset-4 transition-colors hover:decoration-emerald-800"
          >
            전체 {storeCount}종 가격표 보기
          </TrackedCta>
        </div>
      </nav>
    </div>
  );
}
