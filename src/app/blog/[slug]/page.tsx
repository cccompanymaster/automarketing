// A blog post: h1 = title, direct answer first, body (Markdown), visible FAQ,
// sources, related posts, change log. JSON-LD (BlogPosting + FAQPage +
// BreadcrumbList) is generated from the same frontmatter as the visible text.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { JsonLd } from "@/components/JsonLd";
import { BLOG_PATH, getPost, getPublishedPosts } from "@/lib/blog";
import { OG_BASE, blogPostingLd, breadcrumbLd, faqLd } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return getPublishedPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const url = `${BLOG_PATH}${post.slug}/`;
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url, types: { "application/rss+xml": "/feed.xml" } },
    openGraph: {
      ...OG_BASE,
      type: "article",
      title: post.title,
      description: post.description,
      url,
      publishedTime: post.datePublished,
      modifiedTime: post.dateModified,
    },
  };
}

const fmt = (d: string) => d.replace(/-/g, ".");

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const related = post.related.map((s) => getPost(s)).filter((p): p is NonNullable<typeof p> => !!p);

  return (
    <>
      <JsonLd
        data={[
          blogPostingLd(post),
          faqLd(post.faq),
          breadcrumbLd([
            { name: "홈", path: "/" },
            { name: "사장님 블로그", path: BLOG_PATH },
            { name: post.title, path: `${BLOG_PATH}${post.slug}/` },
          ]),
        ]}
      />
      <SiteHeader />
      <main className="flex-1 bg-white">
        <article className="mx-auto max-w-3xl px-5 pb-16 pt-8 sm:pt-12">
          <nav aria-label="이동 경로" className="text-sm text-slate-500">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <Link href="/" className="hover:text-slate-800">
                  홈
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href={BLOG_PATH} className="font-semibold text-emerald-700 hover:text-emerald-900">
                  사장님 블로그
                </Link>
              </li>
            </ol>
          </nav>

          <h1 className="mt-4 pr-16 text-2xl font-extrabold leading-snug text-slate-900 sm:text-3xl lg:pr-0">{post.title}</h1>
          <p className="mt-3 text-xs text-slate-500">
            {post.author} · 발행 <time dateTime={post.datePublished}>{fmt(post.datePublished)}</time>
            {post.dateModified !== post.datePublished && (
              <>
                {" "}
                · 수정 <time dateTime={post.dateModified}>{fmt(post.dateModified)}</time>
              </>
            )}{" "}
            · 데이터 기준일 {fmt(post.data_asof)}
          </p>

          {/* Direct answer — the sentence answer engines extract. */}
          <p className="mt-6 rounded-2xl bg-emerald-50 px-5 py-4 text-lg font-bold leading-relaxed text-emerald-950 ring-1 ring-emerald-100">
            {post.answer}
          </p>

          <div className="post-body mt-2" dangerouslySetInnerHTML={{ __html: post.html }} />

          <section aria-labelledby="post-faq" className="mt-10">
            <h2 id="post-faq" className="text-xl font-extrabold text-slate-900">
              자주 묻는 질문
            </h2>
            <dl className="mt-3 divide-y divide-slate-100 rounded-2xl ring-1 ring-slate-100">
              {post.faq.map((f) => (
                <div key={f.q} className="px-5 py-4">
                  <dt className="font-bold text-slate-900">{f.q}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-slate-600">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="post-sources" className="mt-8 rounded-2xl bg-slate-50 px-5 py-4 text-sm">
            <h2 id="post-sources" className="font-bold text-slate-800">
              출처와 검수
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
              {post.sources.map((s) => (
                <li key={s.url + s.name}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-slate-900">
                    {s.name}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-slate-500">
              수치 검수: {post.reviewedBy} · 본문 수치 기준일 {fmt(post.data_asof)}
            </p>
            {post.changelog.length > 0 && (
              <ul className="mt-2 space-y-0.5 text-xs text-slate-400">
                {post.changelog.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            )}
          </section>

          {related.length > 0 && (
            <section aria-labelledby="post-related" className="mt-8">
              <h2 id="post-related" className="text-base font-bold text-slate-900">
                함께 보면 좋은 글
              </h2>
              <ul className="mt-2 space-y-2">
                {related.map((r) => (
                  <li key={r.slug}>
                    <Link href={`${BLOG_PATH}${r.slug}/`} className="font-semibold text-emerald-700 underline underline-offset-2 hover:text-emerald-900">
                      {r.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
