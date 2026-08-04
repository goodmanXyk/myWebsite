// 内置中文字体：Noto Sans SC（思源黑体）——现代黑体风格，与 OpenAI Sans SC 观感一致
import localFont from "next/font/local";

export const notoSansSC = localFont({
  src: [
    { path: "./NotoSansSC-400.woff2", weight: "400", style: "normal" },
    { path: "./NotoSansSC-500.woff2", weight: "500", style: "normal" },
    { path: "./NotoSansSC-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-noto-sc",
  display: "swap",
  preload: false,
});
