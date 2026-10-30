// A 마케팅 칼럼 post — same view and gate as the blog (see PostArticle).

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostArticle } from "@/components/PostArticle";
import { COLUMN, getPost, getPublishedPosts } from "@/lib/blog";
import { OG_BASE } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return getPublishedPosts(COLUMN).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug, COLUMN);
  if (!post) return {};
  const url = `${COLUMN.path}${post.slug}/`;
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

export default async function ColumnPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug, COLUMN);
  if (!post) notFound();
  return <PostArticle post={post} collection={COLUMN} />;
}
