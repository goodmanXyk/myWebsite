/** @type {import('next').NextConfig} */
// 部署到 Vercel：使用 Vercel 原生 Next.js 构建（自动 HTTPS / 自动重建），
// 不再做静态导出（output:"export" 会与 Vercel 框架流程冲突，导致其找不到 routes-manifest.json）。
const nextConfig = {
  reactStrictMode: true,
  // pdf-parse 内部用动态 require 加载内置 pdf.js，需保持服务端外部依赖
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse"],
  },
};

export default nextConfig;
