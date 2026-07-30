# Vercel 自定义域名部署手册 — 域名 jasonxyk.cn

代码已 push 到 GitHub（`goodmanXyk/myWebsite`，main 分支）。下面「登录 + 点击」步骤需你用自己的账号完成——我无法代登你的 Vercel / GitHub / 腾讯云账号。配置已就绪，照着点约 5–10 分钟。

> **重要变更（已修复部署报错）**：项目已改用 **Vercel 原生 Next.js 构建**。已移除 `next.config.mjs` 里的 `output: "export"` 和仓库根的 `vercel.json`——这两样会把产物指向静态导出的 `out/` 目录，与 Vercel 的 Next.js 框架流程冲突，会报
> `Error: The file ".../out/routes-manifest.json" couldn't be found`。
> 现在 Vercel 自动识别 Next.js，**无需任何额外配置文件**。

---

## 关于 .cn 域名 + 免备案

- `jasonxyk.cn` 由 CNNIC 管理，注册时已要求实名（腾讯云购买流程包含）。
- 网站实际托管在 **Vercel（境外节点）**，域名只做流量指向 → **无需 ICP 备案**。
- 只有「使用中国大陆境内服务器提供 web 服务」才强制备案。走境外路线不备案。

---

## 第 1 步（已完成 ✅）：代码已推到 GitHub

`goodmanXyk/myWebsite` 的 main 分支已有最新代码（含本次修复）。无需再操作。

---

## 第 2 步（你）：Vercel 导入并首次部署

1. 打开 https://vercel.com ，用 **GitHub 登录**。
2. 点 **Add New → Project** → 选中 `goodmanXyk/myWebsite`。
3. Framework 会**自动识别为 Next.js**，**无需任何额外配置**（没有 `vercel.json`，也不用指定 Output Directory / Build Command，Vercel 默认就是 `next build`）。
4. 点 **Deploy**，约 1–2 分钟。
5. 完成后得到免费域名 `xxx.vercel.app`，HTTPS 自带，可先验证打开。

---

## 第 3 步（你）：在 Vercel 添加自定义域名

1. 进入项目 → **Settings → Domains**。
2. 输入 `jasonxyk.cn`，点 **Add**；再同样添加一次 `www.jasonxyk.cn`。
3. Vercel 会显示它要求的 DNS 记录（以页面显示为准）。常见为：

| 类型 | 名称 | 值 |
|---|---|---|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

> 更简单（二选一）：在腾讯云把域名 **Nameserver** 改为 Vercel 的
> `ns1.vercel-dns.com` / `ns2.vercel-dns.com`，DNS 全交给 Vercel，连 A/CNAME 都不用填（.cn 的 NS 生效较慢，最多 48h）。

---

## 第 4 步（你）：在腾讯云后台填 DNS

1. 登录腾讯云 → **DNS 解析 DNSPod** → 找到 `jasonxyk.cn`。
2. 点 **添加记录**：
   - **A 记录**：主机记录 `@`，记录值 `76.76.21.21`。
   - **CNAME 记录**：主机记录 `www`，记录值 `cname.vercel-dns.com`。
3. 保存。DNS 生效通常 **5 分钟～24 小时**（多数 10 分钟内）。

---

## 第 5 步：HTTPS（基本自动）

- Vercel 为 `jasonxyk.cn` **自动签发免费证书（Let's Encrypt）**，几分钟内生效。
- 生效后访问 `https://jasonxyk.cn` 即带小锁。
- 建议开启 **"Redirect www to non-www"** 统一入口。

---

## 故障排查

- **仍报 `routes-manifest.json` 找不到**：确认仓库根目录**没有** `vercel.json`，且 `next.config.mjs` 里**没有** `output: "export"`。改完 `git push` 触发 Vercel 重新部署。
- **部署后页面空白/一直重定向到登录页**：本地 `npm run dev` 验证登录流程正常即可（Vercel 是 SSR，localStorage 在客户端读取，逻辑与本地一致）。
- **Vercel 构建失败**：把红色报错文字发我。

---

## 以后怎么更新网站

- 改完代码 → `git push` 到 GitHub → Vercel **自动重新部署**，几十秒后线上更新。
- 数据仍在用户浏览器 localStorage（路线 A 设定），不涉及服务器数据库。

---

## 我（AI）做不到、必须由你来的部分

- 登录你的 GitHub / Vercel / 腾讯云账号；
- 在 Vercel 后台绑域名、在腾讯云后台填 DNS。
这些需要你的个人凭证，出于安全我不会、也不能代为操作。其余构建、配置、文档我已全部完成。
