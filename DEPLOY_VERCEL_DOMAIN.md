# Vercel 自定义域名部署手册（路线 A · 你只需点几下）

本手册对应：域名你已在腾讯云 / 阿里云购买并完成实名；代码已由我初始化 git 并提交；下面这些「登录 + 点击」步骤需要你用自己的账号完成——我无法代登你的 Vercel / GitHub / 注册商账号。但所有配置（含 `vercel.json`）已就绪，照着点约 5 分钟。

> 文中 `yourdomain.com` 替换成你真实买的域名。

---

## 第 1 步（你）：把代码推到 GitHub

我已经在本地 `git init` 并做了初始提交（已忽略 `node_modules`、`.next`、`out`）。

1. 在 GitHub 新建一个**空仓库**（不要勾选 README/.gitignore）。
2. 本地执行（把 URL 换成你的仓库地址）：
   ```bash
   git remote add origin https://github.com/<你的用户名>/<仓库名>.git
   git branch -M main
   git push -u origin main
   ```
3. 刷新 GitHub 页面，确认代码已上传。

> 不想用 GitHub？也可以装 Vercel CLI：`npm i -g vercel` → 在项目目录执行 `vercel` 登录并部署（同样需你登录）。

---

## 第 2 步（你）：Vercel 导入并首次部署

1. 打开 https://vercel.com ，用 **GitHub 登录**。
2. 点 **Add New → Project** → 选中刚才的仓库。
3. Framework 会**自动识别为 Next.js**；Build Command 默认 `npm run build`，Output Directory 为 `out`（已由 `vercel.json` 锁定）。
4. 点 **Deploy**，约 1–2 分钟。
5. 完成后得到一个免费域名，形如 `xxx.vercel.app`，HTTPS 自带，可直接访问。

---

## 第 3 步（你）：在 Vercel 添加自定义域名

1. 进入项目 → **Settings → Domains**。
2. 输入 `yourdomain.com`，再点 **Add** 添加一次 `www.yourdomain.com`。
3. Vercel 会显示**它要求你添加的 DNS 记录**（以页面上显示的为准）。常见为：

| 类型 | 名称 | 值 | 说明 |
|---|---|---|---|
| A | `@` | `76.76.21.21` | 根域名 yourdomain.com |
| CNAME | `www` | `cname.vercel-dns.com` | www.yourdomain.com |

> 更简单的方式（二选一）：在域名注册商处把 **Nameserver** 改为 Vercel 提供的
> `ns1.vercel-dns.com` / `ns2.vercel-dns.com`，之后 DNS 由 Vercel 自动托管，连上面的 A/CNAME 都不用手填。

---

## 第 4 步（你）：在腾讯云 / 阿里云后台填 DNS

1. 登录你买域名的平台（腾讯云 DNSPod / 阿里云云解析）。
2. 找到该域名的 **DNS 解析 / 解析设置**。
3. 按第 3 步 Vercel 给的记录添加：
   - 添加 **A 记录**：主机记录 `@`，记录值 `76.76.21.21`。
   - 添加 **CNAME 记录**：主机记录 `www`，记录值 `cname.vercel-dns.com`。
4. 保存。DNS 生效通常 **5 分钟～24 小时**（多数 10 分钟内）。

---

## 第 5 步：HTTPS（基本自动）

- Vercel 会为你的域名**自动签发免费证书（Let's Encrypt）**，几分钟内生效。
- 生效后访问 `https://yourdomain.com` 即带小锁，无需你额外操作。
- 建议在 Vercel Domains 里开启 **"Redirect www to non-www"** 或反之，统一入口。

---

## 以后怎么更新网站

- 改完代码 → `git push` 到 GitHub → Vercel **自动重新部署**，几十秒后线上更新。
- 全部数据仍在用户浏览器 localStorage（路线 A 设定），不涉及服务器数据库。

---

## 我（AI）做不到、必须由你来的部分（再次确认）

- 登录你的 GitHub / Vercel / 腾讯云·阿里云账号；
- 在注册商后台填 DNS、在 Vercel 后台绑域名。
这些都需要你的个人凭证，出于安全我不会、也不能代为操作。除此外的构建、配置、文档我已全部完成。
