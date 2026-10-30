// A blog post: h1 = title, direct answer first, body (Markdown), visible FAQ,
// sources, related posts, change log. JSON-LD (BlogPosting + FAQPage +
// BreadcrumbList) is generated from the same frontmatter as the visible text.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostArticle } from "@/components/PostArticle";
import { BLOG, BLOG_PATH, getPost, getPublishedPosts } from "@/lib/blog";
import { OG_BASE } from "@/lib/seo";

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

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  return <PostArticle post={post} collection={BLOG} />;
}
