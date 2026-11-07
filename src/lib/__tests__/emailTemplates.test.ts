import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { emailGuideMarkdown, emailTemplates } from "@/lib/emailTemplates";
import { COMPANY } from "@/lib/company";

describe("auth email templates", () => {
  it("docs are up to date (run `npm run email:templates` and paste into Supabase)", () => {
    expect(fs.readFileSync(path.join(process.cwd(), "docs", "EMAIL_TEMPLATES.md"), "utf8")).toBe(emailGuideMarkdown());
    for (const t of emailTemplates())
      expect(fs.readFileSync(path.join(process.cwd(), "docs", "email-templates", `${t.key}.html`), "utf8"), t.key).toBe(t.html);
  });

  it("carry the current business info and the Supabase variables they need", () => {
    for (const t of emailTemplates()) {
      expect(t.html).toContain(COMPANY.companyName);
      expect(t.html).toContain(COMPANY.businessRegistrationNumber);
      expect(t.html).toContain("{{ .Email }}");
    }
    const [signup, reset, , linked] = emailTemplates();
    expect(signup.html).toContain("{{ .ConfirmationURL }}");
    expect(reset.html).toContain("{{ .ConfirmationURL }}");
    expect(linked.html).toContain("{{ .Provider }}");
  });
});
