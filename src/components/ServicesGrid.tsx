// Landing service grid — all cards visible at once. The two group (bundle)
// cards lead as wide featured spotlights; the remaining products fill a 4-col
// grid (2 featured + 8 standard). Cards reveal with a small stagger.

import { ServiceCard } from "@/components/ServiceCard";
import { Reveal } from "@/components/Reveal";
import type { ServiceCardData } from "@/lib/products";

const FEATURED_COUNT = 2;

export function ServicesGrid({ cards }: { cards: ServiceCardData[] }) {
  return (
    <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, i) => {
        const featured = i < FEATURED_COUNT;
        return (
          <Reveal
            key={card.href}
            delayMs={(i % 4) * 70}
            className={featured ? "sm:col-span-2" : ""}
          >
            <div className="h-full">
              <ServiceCard card={card} featured={featured} />
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}
