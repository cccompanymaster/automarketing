// Landing service grid as a bento: tiles differ in size but interlock into a
// clean rectangle (no holes) at every breakpoint, one message per tile.
//
//   lg (4 cols)                     sm (2 cols)
//   [ place-map ][ blog-pack  ]     [ place-map  ]
//   [  (2×2)    ][ ·  ][ ·    ]     [ blog-pack  ]
//   [ · ][ · ][ · ][ ·        ]     [ · ][ ·     ]  ×4 rows of singles
//   [ · ][ · ][ refund        ]     [ refund     ]
//   [ consulting (banner)     ]     [ consulting ]
//
// The layout assumes LANDING_CARDS' order (2 groups, 8 products, refund,
// consulting); any other slug falls back to a 1×1 tile.

import { ServiceCard } from "@/components/ServiceCard";
import { Reveal } from "@/components/Reveal";
import type { ServiceCardData } from "@/lib/products";

type Tile = { cls: string; hero?: boolean; featured?: boolean; wide?: boolean; ribbon?: string };

const TILES: Record<string, Tile> = {
  "place-map": { cls: "sm:col-span-2 lg:row-span-2", hero: true, featured: true, ribbon: "인기 묶음 ⭐" },
  "blog-pack": { cls: "sm:col-span-2", featured: true, ribbon: "인기 묶음 ⭐" },
  refund: { cls: "sm:col-span-2", featured: true },
  consulting: { cls: "sm:col-span-2 lg:col-span-4", wide: true },
};

export function ServicesGrid({ cards }: { cards: ServiceCardData[] }) {
  return (
    <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-flow-dense lg:grid-cols-4">
      {cards.map((card, i) => {
        const t = TILES[card.trackId] ?? { cls: "" };
        return (
          <Reveal key={card.href} delayMs={(i % 4) * 70} className={t.cls}>
            <div className="h-full">
              <ServiceCard card={card} hero={t.hero} featured={t.featured} wide={t.wide} ribbon={t.ribbon} />
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}
