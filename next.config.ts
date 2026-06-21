import type { NextConfig } from "next";

// Static export so the site can be hosted on GitHub Pages (no server needed).
// On GitHub Pages a project site lives under /<repo>, so basePath/assetPrefix
// are driven by NEXT_PUBLIC_BASE_PATH (set in the deploy workflow). Locally it
// defaults to "" so `npm run dev` / `npm run build` work at the root.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  // Trailing slashes make static hosts resolve /route/ -> /route/index.html.
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
