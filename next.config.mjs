/** @type {import('next').NextConfig} */
const nextConfig = {
  // 路线A：纯静态导出，可托管到任意免费静态平台（Vercel/Netlify/CloudStudio/GitHub Pages）
  output: "export",
  // 静态导出不支持服务端图片优化，统一关闭
  images: { unoptimized: true },
  // 若后续切回服务端渲染，注释掉 output 与 images 即可
};

export default nextConfig;
