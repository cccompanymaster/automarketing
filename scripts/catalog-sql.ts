// Writes supabase/catalog.sql from the price list (see src/lib/catalogSql.ts).
import fs from "node:fs";
import { catalogSql } from "../src/lib/catalogSql";

fs.writeFileSync("supabase/catalog.sql", catalogSql());
console.log("supabase/catalog.sql updated");
