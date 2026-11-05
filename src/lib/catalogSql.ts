// The server-side price table (public.catalog_items) is generated from the
// same PRICING the site shows, so place_order can recompute every order's
// amount instead of trusting the client. `npm run catalog:sql` rewrites
// supabase/catalog.sql; a test fails when it is out of date, and the SQL is
// applied as a migration whenever prices change.

import { PRICING, type PricingGroup } from "@/lib/pricing";
import { PRESS_CATEGORIES, pressOrderName } from "@/lib/press";
import { addOnRows } from "@/lib/orderForms";

export interface CatalogRow {
  name: string;
  amountKrw: number;
  /** Quantity applies (row has a unit); otherwise one order = one unit. */
  unitBased: boolean;
  minQty: number;
  step: number;
}

export function catalogRows(groups: PricingGroup[] = PRICING): CatalogRow[] {
  const base = groups
    .flatMap((g) => g.items)
    .filter((i) => i.amountKrw != null && !i.inquiry)
    .map((i) => ({ name: i.name, amountKrw: i.amountKrw!, unitBased: Boolean(i.unit), minQty: i.minQty ?? 1, step: i.step ?? 1 }));
  const byName = new Map(base.map((r) => [r.name, r]));
  return base
    // The press page orders each category at its starting price.
    .concat(PRESS_CATEGORIES.map((c) => ({ name: pressOrderName(c.name), amountKrw: c.priceMin, unitBased: true, minQty: 1, step: 1 })))
    // Paid order-form options ("<상품> + 카테고리 지정"): same rules as the base row.
    .concat(
      addOnRows((n) => byName.get(n)?.amountKrw).map((a) => ({ ...byName.get(a.base)!, name: a.name, amountKrw: a.amountKrw })),
    );
}

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;

export function catalogSql(rows: CatalogRow[] = catalogRows()): string {
  const values = rows
    .map((r) => `  (${q(r.name)}, ${r.amountKrw}, ${r.unitBased}, ${r.minQty}, ${r.step})`)
    .join(",\n");
  return `-- Generated from src/lib/pricing.ts by \`npm run catalog:sql\` — do not edit by hand.
-- Apply as a migration whenever prices change (place_order prices from this table).
update public.catalog_items set active = false;
insert into public.catalog_items (name, amount_krw, unit_based, min_qty, step) values
${values}
on conflict (name) do update set
  amount_krw = excluded.amount_krw, unit_based = excluded.unit_based,
  min_qty = excluded.min_qty, step = excluded.step, active = true, updated_at = now();
`;
}
