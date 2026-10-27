// Landing service grid as a bento: tiles differ in size but interlock into a
// clean rectangle (no holes) at every breakpoint, one message per tile.
//
// Breakpoints are container queries (the column count follows the space left
// between the wings, not the viewport):
//   @4xl (4 cols)                   @xl (2 cols)
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

type Tile = {
  cls: string;
  hero?: boolean;
  featured?: boolean;
  wide?: boolean;
  ribbon?: string;
};

const TILES: Record<string, Tile> = {
  "place-map": {
    cls: "@xl:col-span-2 @4xl:row-span-2",
    hero: true,
    featured: true,
    ribbon: "인기 묶음 ⭐",
  },
  "blog-pack": {
    cls: "@xl:col-span-2",
    featured: true,
    ribbon: "인기 묶음 ⭐",
  },
  refund: { cls: "@xl:col-span-2", featured: true },
  consulting: { cls: "@xl:col-span-2 @4xl:col-span-4", wide: true },
};

export function ServicesGrid({ cards }: { cards: ServiceCardData[] }) {
  return (
    <div className="@container mt-10">
      <div className="grid grid-cols-1 gap-4 @xl:grid-cols-2 @4xl:grid-flow-dense @4xl:grid-cols-4">
        {cards.map((card, i) => {
          const t = TILES[card.trackId] ?? { cls: "" };
          return (
            <Reveal key={card.href} delayMs={(i % 4) * 70} className={t.cls}>
              <div className="h-full">
                <ServiceCard
                  card={card}
                  hero={t.hero}
                  featured={t.featured}
                  wide={t.wide}
                  ribbon={t.ribbon}
                />
              </div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
