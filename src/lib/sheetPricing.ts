// Live pricing from a published Google Sheet. The built-in PRICING catalog is
// the fallback/base; when NEXT_PUBLIC_PRICE_SHEET_CSV_URL is set (a "웹에
// 게시" CSV link), rows in the sheet override matching items by (group, name)
// and can append new items or hide existing ones — so prices are adjustable
// from the spreadsheet without a redeploy.
//
// Sheet columns (header row required, order-insensitive):
//   group | name | price | unit | amountKrw | note | inquiry | hide
// - group: PRICING group key (blog/reward/place/cafe/ai/sns/kakaomap/daangn/press)
// - price: display string ("1,500원"); amountKrw: orderable KRW number (empty = not orderable)
// - inquiry/hide: 1/true to flag
// Setup guide: docs/SHEET_INTEGRATION.md

import { PRICING, type PricingGroup, type PricingItem } from "@/lib/pricing";

const SHEET_CSV_URL = process.env.NEXT_PUBLIC_PRICE_SHEET_CSV_URL;

export const isSheetPricingConfigured = Boolean(SHEET_CSV_URL);

/** Minimal CSV parser (handles quoted fields, commas, CRLF). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else inQuotes = false;
      } else cell += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((v) => v.trim() !== "")) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((v) => v.trim() !== "")) rows.push(row);
  return rows;
}

const truthy = (v: string | undefined) =>
  !!v && ["1", "true", "y", "yes", "o"].includes(v.trim().toLowerCase());

interface SheetRow {
  group: string;
  item: Partial<PricingItem> & { name: string };
  hide: boolean;
}

function toRows(csv: string[][]): SheetRow[] {
  if (csv.length < 2) return [];
  const header = csv[0].map((h) => h.trim().toLowerCase());
  const idx = (k: string) => header.indexOf(k);
  const gi = idx("group"), ni = idx("name");
  if (gi < 0 || ni < 0) return [];
  const pi = idx("price"), ui = idx("unit"), ai = idx("amountkrw"), oi = idx("note"),
    qi = idx("inquiry"), hi = idx("hide");
  const rows: SheetRow[] = [];
  for (const r of csv.slice(1)) {
    const group = (r[gi] ?? "").trim();
    const name = (r[ni] ?? "").trim();
    if (!group || !name) continue;
    const amountRaw = ai >= 0 ? (r[ai] ?? "").replace(/[,\s원]/g, "") : "";
    const item: SheetRow["item"] = { name };
    if (pi >= 0 && r[pi]?.trim()) item.price = r[pi].trim();
    if (ui >= 0 && r[ui]?.trim()) item.unit = r[ui].trim();
    if (oi >= 0 && r[oi]?.trim()) item.note = r[oi].trim();
    if (amountRaw && !Number.isNaN(Number(amountRaw))) item.amountKrw = Number(amountRaw);
    if (qi >= 0) item.inquiry = truthy(r[qi]) || undefined;
    rows.push({ group, item, hide: hi >= 0 && truthy(r[hi]) });
  }
  return rows;
}

/** Merge sheet rows over the built-in catalog (override / append / hide). */
export function mergePricing(base: PricingGroup[], rows: SheetRow[]): PricingGroup[] {
  return base.map((group) => {
    const forGroup = rows.filter((r) => r.group === group.key);
    if (forGroup.length === 0) return group;
    let items: PricingItem[] = group.items.map((it) => {
      const override = forGroup.find((r) => r.item.name === it.name);
      if (!override) return it;
      // Sheet's amountKrw column empty on an override → keep base amount unless
      // price text was changed without a number (then drop orderability only
      // when inquiry was flagged).
      return { ...it, ...override.item, inquiry: override.item.inquiry ?? it.inquiry };
    });
    // Hide flagged rows.
    const hidden = new Set(forGroup.filter((r) => r.hide).map((r) => r.item.name));
    items = items.filter((it) => !hidden.has(it.name));
    // Append rows that don't exist yet (need at least a price).
    for (const r of forGroup) {
      if (r.hide) continue;
      if (!items.some((it) => it.name === r.item.name) && r.item.price) {
        items.push({ price: r.item.price, ...r.item } as PricingItem);
      }
    }
    return { ...group, items };
  });
}

/**
 * Fetch live pricing. Returns the merged catalog, or null when the sheet is
 * not configured / unreachable (callers keep the built-in PRICING).
 */
export async function fetchLivePricing(): Promise<PricingGroup[] | null> {
  if (!SHEET_CSV_URL) return null;
  try {
    const res = await fetch(SHEET_CSV_URL, { cache: "no-store" });
    if (!res.ok) return null;
    const rows = toRows(parseCsv(await res.text()));
    if (rows.length === 0) return null;
    return mergePricing(PRICING, rows);
  } catch {
    return null;
  }
}
