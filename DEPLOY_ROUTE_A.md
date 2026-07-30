# 路线 A 部署指南（纯前端 · 免费海外托管 · 免备案）

本指南对应「路线 A」：把站点以**纯静态**方式托管到免费海外平台，数据仍存于用户浏览器（localStorage），无需购买服务器、无需 ICP 备案。

> 当前代码已配置 `next.config.mjs` 的 `output: "export"`，构建后产物在 `out/` 目录，可直接托管到任意静态平台。

---

## 一、本地构建（生成静态文件）

```bash
npm install          # 首次或依赖变更时
npm run build        # 输出到 out/ 目录（10 个静态页面）
```

构建成功后，`out/` 内含 `index.html`、`login.html`、`register.html`、`console/`、`_next/` 等，这就是要上传的全部内容。

---

## 二、选择托管平台（任选其一，均免费起步）

### 方案 1：Vercel（最省事，推荐）
1. 注册 https://vercel.com （可用 GitHub 登录）。
2. 新建项目 → 导入你的 Git 仓库（或 `vercel` CLI 直接拖拽部署）。
3. Framework 选 **Next.js**，构建命令 `npm run build`，输出目录 `out`。
4. 部署完成自动得到 `xxx.vercel.app` 域名，HTTPS 自带。

### 方案 2：Netlify Drop（零配置）
1. 打开 https://app.netlify.com/drop 。
2. 直接把本地 `out/` 文件夹拖进去。
3. 自动得到 `xxx.netlify.app` 域名，HTTPS 自带。

### 方案 3：CloudStudio / GitHub Pages
- CloudStudio：导入静态目录即可，自动分配预览域名。
- GitHub Pages：把 `out/` 内容推到仓库 `gh-pages` 分支，开启 Pages 即可（`*.github.io`）。

> 本次已在 CloudStudio 部署验证，预览地址见对话中的分享链接。

---

## 三、绑定自定义域名（可选，约 ¥30–75/年）

以域名 `yourdomain.com` 为例（在国内或海外注册商购买均可，路线 A 无需备案）：

1. **域名实名**：购买后完成实名认证（免费，法定要求）。
2. **解析配置**（在域名注册商后台添加记录）：

| 类型 | 主机名 | 值 | 说明 |
|---|---|---|---|
| CNAME | `www` | `你的平台域名`（如 `cname.vercel-dns.com`） | 访问 www.yourdomain.com |
| A | `@` | `平台分配的服务器 IP` | 访问 yourdomain.com（若平台支持） |

3. **开启 HTTPS**：Vercel/Netlify 在域名设置里一键申请免费证书（Let's Encrypt），几分钟生效。
4. 平台后台填好自定义域名后，等 DNS 生效（通常 5 分钟–24 小时）即可访问。

> 路线 A 用海外平台 + 海外/任意域名，**不需要 ICP 备案**。

---

## 四、重要提醒：数据存哪、以后怎么办

### 当前数据位置
- 所有账号、待办、健康数据都写在**用户自己的浏览器 localStorage**（key 如 `aiwf_users`、`aiwf_todos_${userId}`）。
- 没有任何服务器数据库；换设备 / 清缓存 = 数据丢失；站长后台看不到用户数据。

### 切到真实多人产品时的数据迁移
- 代码已预留 `lib/store` 抽象层（`LocalStore` ↔ 未来 `RemoteStore`）。将来接后端数据库（如 Supabase）时，**只换 store 实现，页面不用改**。
- ⚠️ 但早期用户在浏览器里的旧数据**不会自动迁移**到新后端。建议现在就给站点加一个「数据导出 / 导入」按钮（JSON 文件），方便老用户手动搬数据，也便于你自己备份测试。

### 安全提示
- 当前密码是明文存在浏览器本地，仅本机可见，暂时可接受；一旦上云做后端，**必须改为密码哈希（bcrypt）**，绝不能明文存储。

---

## 五、成本回顾（路线 A）

| 项目 | 费用 |
|---|---|
| 域名（.com/.cn） | ¥30–75/年 |
| 托管（Vercel/Netlify/CloudStudio 免费版） | ¥0 |
| SSL 证书 | ¥0 |
| ICP 备案 | 不需要 |
| **首年合计** | **≈ ¥30–150** |

---

## 六、回退说明
若以后要做服务端渲染 / 接后端 API，把 `next.config.mjs` 里的 `output: "export"` 与 `images: { unoptimized: true }` 注释掉，恢复 `npm run build` + `npm run start` 即可，页面代码无需改动。
