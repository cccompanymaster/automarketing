// Publish gate (skill content.md 4-4) — runs over every post that isn't a
// draft. The deploy workflow runs `npm test` before building, so a post that
// fails here never reaches production.

import { describe, expect, it } from "vitest";
import path from "node:path";
import { BLOG_PATH, readAllPosts, validatePost, type Post } from "@/lib/blog";
import { CALCULATORS, CALC_HUB_PATH } from "@/lib/calc/registry";
import { PRODUCT_SLUGS, GROUP_KEYS } from "@/lib/products";

const posts = readAllPosts(path.join(process.cwd(), "content", "blog")).filter((p) => p.status !== "draft");

const knownPaths = new Set<string>([
  "/",
  "/start/",
  "/terms/",
  "/privacy/",
  CALC_HUB_PATH,
  "/tools/rates/",
  "/tools/blog-writer/",
  BLOG_PATH,
  ...CALCULATORS.map((c) => c.path),
  ...PRODUCT_SLUGS.map((s) => `/services/${s}/`),
  ...GROUP_KEYS.map((s) => `/services/${s}/`),
  ...posts.map((p) => `${BLOG_PATH}${p.slug}/`),
]);
const allSlugs = new Set(posts.map((p) => p.slug));

describe("blog publish gate", () => {
  it("has at least one published post", () => {
    expect(posts.length).toBeGreaterThan(0);
  });

  it.each(posts.map((p) => [p.slug, p] as [string, Post]))("%s passes the gate", (_slug, p) => {
    expect(validatePost(p, { knownPaths, allSlugs })).toEqual([]);
  });

  it("titles, descriptions, questions and slugs are unique", () => {
    for (const key of ["title", "description", "question", "slug"] as const) {
      const values = posts.map((p) => p[key]);
      expect(new Set(values).size, key).toBe(values.length);
    }
  });
});

describe("validatePost catches problems", () => {
  const good = posts[0];
  it("missing question / long answer / no sources / no reviewer", () => {
    const bad = { ...good, question: "", answer: "가".repeat(81), sources: [], reviewedBy: "" };
    const e = validatePost(bad);
    expect(e.join()).toMatch(/question/);
    expect(e.join()).toMatch(/answer/);
    expect(e.join()).toMatch(/sources/);
    expect(e.join()).toMatch(/reviewedBy/);
  });
  it("broken internal link and missing data date", () => {
    const bad = { ...good, body: "[허브](/blog/) [a](/tools/nope/) [b](/tools/vat/)", data_asof: "2026-01-01" };
    const e = validatePost(bad, { knownPaths });
    expect(e.join()).toMatch(/끊긴 내부 링크: \/tools\/nope\//);
    expect(e.join()).toMatch(/data_asof/);
  });
});

describe("renderMarkdown", () => {
  it("keeps ~ ranges literal (no strikethrough)", async () => {
    const { renderMarkdown } = await import("@/lib/blog");
    const html = renderMarkdown("기준소득월액 41만~659만 원, 2,400~3,400원");
    expect(html).not.toContain("<del>");
    expect(html).toContain("41만~659만 원");
  });
});
