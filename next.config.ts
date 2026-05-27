import type { NextConfig } from "next";

/** 与 .env 中 BACKEND_URL 一致，供未配置 NEXT_PUBLIC_BACKEND_URL 时的同源代理 */
const backendUrl =
  process.env.BACKEND_URL?.replace(/\/$/, "") ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/documents/:path*",
        destination: `${backendUrl}/api/documents/:path*`,
      },
    ];
  },
};

export default nextConfig;
