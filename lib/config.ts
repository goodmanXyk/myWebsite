// 集中管理部署/后端相关环境变量。
// 当前阶段恒为 local（纯前端 localStorage mock）。
// 未来接真实后端时：NEXT_PUBLIC_API_MODE=remote + NEXT_PUBLIC_API_BASE=后端基址。
export const API_MODE = process.env.NEXT_PUBLIC_API_MODE || "local";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";
