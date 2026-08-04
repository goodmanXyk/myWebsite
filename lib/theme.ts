// 集中管理站点与主题相关的常量，便于后续微调成更贴近 OpenAI 的观感。

export const COLORS = {
  ink: "#ffffff",
  muted: "#8f8f8f",
  line: "rgba(255, 255, 255, 0.06)",
  brand: "#f5f5f5",
  brandDark: "#d4d4d4",
  canvas: "#131313",
  surface: "#161616",
  surface2: "#1c1c1c",
} as const;

export const SITE = {
  name: "OvixAI",
  nameZh: "AI 工作流平台",
  tagline: "Build, run and scale your AI workflows",
} as const;
