import { describe, expect, it } from "vitest";
import { PRICING } from "@/lib/pricing";
import { BUNDLES, storeProducts } from "@/lib/store";

describe("store bundles", () => {
  it("every bundled row exists in the price list (renames must update BUNDLES)", () => {
    for (const b of BUNDLES) {
      const group = PRICING.find((g) => g.key === b.group);
      expect(group, b.id).toBeDefined();
      for (const name of b.items) expect(group!.items.map((i) => i.name), `${b.id}: ${name}`).toContain(name);
      if (b.lead) expect(b.items, `${b.id} lead`).toContain(b.lead);
    }
  });

  it("every price row appears exactly once in the store", () => {
    const shown = storeProducts(PRICING).flatMap((p) => p.options.map((o) => o.name));
    const rows = PRICING.flatMap((g) => g.items.map((i) => i.name));
    expect(shown.sort()).toEqual(rows.sort());
  });
});
