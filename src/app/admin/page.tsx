// Admin dashboard. The page itself is static; everything sensitive comes from
// admin-only RPCs at runtime. The content list (posts and their publish dates)
// is gathered here at build time and handed to the client app.

import { AdminApp } from "@/components/admin/AdminApp";
import type { ContentSummary } from "@/components/admin/AdminContent";
import { BLOG, COLUMN, readAllPosts, todayKst } from "@/lib/blog";

function contentSummary(): ContentSummary {
  const today = todayKst();
  const posts = [BLOG, COLUMN].flatMap((c) =>
    readAllPosts(c.dir)
      .filter((p) => p.status === "published" || p.status === "refresh-needed")
      .map((p) => ({ title: p.title, path: `${c.path}${p.slug}/`, date: p.datePublished, collection: c.name, scheduled: p.datePublished > today })),
  );
  posts.sort((a, b) => b.date.localeCompare(a.date));
  const upcoming = posts.filter((p) => p.scheduled).map((p) => p.date).sort();
  const nextDate = upcoming[0] ?? null;
  return {
    asOf: today,
    collections: [BLOG, COLUMN].map((c) => ({
      name: c.name,
      path: c.path,
      published: posts.filter((p) => p.collection === c.name && !p.scheduled).length,
      scheduled: posts.filter((p) => p.collection === c.name && p.scheduled).length,
    })),
    nextDate,
    nextCount: upcoming.filter((d) => d === nextDate).length,
    posts,
  };
}

export default function AdminPage() {
  return <AdminApp content={contentSummary()} />;
}
