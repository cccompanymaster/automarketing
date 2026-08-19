import type { Metadata } from "next";

// Members-only rate card — keep it out of search indexes.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
