import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { WalletProvider } from "@/components/WalletProvider";
import { OrdersProvider } from "@/components/OrdersProvider";
import { DeliverablesProvider } from "@/components/DeliverablesProvider";
import { GtmScript, GtmNoScript } from "@/components/GtmScript";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const SITE_TITLE = "마케팅방주 — 대행사 없이 시작하는 우리 매장 마케팅";
const SITE_DESCRIPTION =
  "소상공인·온라인 셀러·매장 운영자를 위한 셀프 마케팅 플랫폼. 플레이스 상위 노출, 쇼핑·블로그 광고, 광고비 환급을 직접 손쉽게 시작하세요.";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://selfmarketing.example",
  ),
  title: {
    default: SITE_TITLE,
    template: "%s — 마케팅방주",
  },
  description: SITE_DESCRIPTION,
  manifest: "/manifest.webmanifest",
  applicationName: "마케팅방주",
  appleWebApp: {
    capable: true,
    title: "마케팅방주",
    statusBarStyle: "default",
  },
  // Static export does not basePath-prefix metadata assets — do it explicitly,
  // otherwise the tag points at /icon.svg on the domain root and 404s.
  icons: {
    icon: `${BASE_PATH}/icon.svg`,
    apple: `${BASE_PATH}/icon.svg`,
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    type: "website",
    locale: "ko_KR",
    siteName: "마케팅방주",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Extend under notches/rounded corners so safe-area insets can be used.
  viewportFit: "cover",
  themeColor: "#059669",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        {/* Pretendard via CDN (dynamic subset). Falls back to system fonts. */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <GtmScript />
      </head>
      <body className="min-h-full flex flex-col bg-white text-slate-900">
        <GtmNoScript />
        <AuthProvider>
          <WalletProvider>
            <OrdersProvider>
              <DeliverablesProvider>{children}</DeliverablesProvider>
            </OrdersProvider>
          </WalletProvider>
        </AuthProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
