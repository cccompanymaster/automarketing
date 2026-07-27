// Landing service grid — all cards visible at once. The two group (bundle)
// cards lead as wide featured spotlights; the remaining products fill a 4-col
// grid (2 featured + 8 standard). Cards reveal with a small stagger.

import { ServiceCard } from "@/components/ServiceCard";
import { Reveal } from "@/components/Reveal";
import type { ServiceCardData } from "@/lib/products";

const FEATURED_COUNT = 2;
// The two "free-entry" products close the grid as a half-width spotlight pair
// so the standard products always fill clean rows of four.
const SPOTLIGHT = new Set(["refund", "consulting"]);

export function ServicesGrid({ cards }: { cards: ServiceCardData[] }) {
  return (
    <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, i) => {
        const featured = i < FEATURED_COUNT;
        const spotlight = SPOTLIGHT.has(card.trackId);
        return (
          <Reveal
            key={card.href}
            delayMs={(i % 4) * 70}
            className={featured || spotlight ? "sm:col-span-2" : ""}
          >
            <div className="h-full">
              <ServiceCard
                card={card}
                featured={featured || spotlight}
                ribbon={featured ? "인기 묶음 ⭐" : undefined}
              />
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}
