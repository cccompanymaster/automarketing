import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { catalogRows, catalogSql } from "@/lib/catalogSql";

describe("server price table", () => {
  it("supabase/catalog.sql matches the price list (run `npm run catalog:sql` and apply it as a migration)", () => {
    const file = fs.readFileSync(path.join(process.cwd(), "supabase", "catalog.sql"), "utf8");
    expect(file).toBe(catalogSql());
  });

  it("every orderable row has a positive price and sane minimum/step", () => {
    for (const r of catalogRows()) {
      expect(r.amountKrw, r.name).toBeGreaterThan(0);
      expect(r.minQty % r.step, r.name).toBe(0);
    }
  });
});
