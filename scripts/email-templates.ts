// Writes docs/email-templates/*.html and docs/EMAIL_TEMPLATES.md (see src/lib/emailTemplates.ts).
import fs from "node:fs";
import { emailGuideMarkdown, emailTemplates } from "../src/lib/emailTemplates";

fs.mkdirSync("docs/email-templates", { recursive: true });
for (const t of emailTemplates()) fs.writeFileSync(`docs/email-templates/${t.key}.html`, t.html);
fs.writeFileSync("docs/EMAIL_TEMPLATES.md", emailGuideMarkdown());
console.log("docs/email-templates/*.html and docs/EMAIL_TEMPLATES.md updated");
