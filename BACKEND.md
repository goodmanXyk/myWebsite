# 后端接入说明（MySQL + Next.js API Route）

本项目已接入真实后端：**Next.js API Route + MySQL**（数据不再只存浏览器 localStorage）。

## 架构

```
浏览器 (React)
  └─ lib/store/RemoteStore  ──fetch──▶  /api/*  (Next.js Route Handler)
                                          └─ mysql2 连接池 ──▶ MySQL（库名 flowai）
```

- 前端通过 `NEXT_PUBLIC_API_MODE` 切换：`local`（localStorage mock，默认）/ `remote`（走 API）
- 数据访问层接口不变（`lib/store/types.ts`），Local/Remote 两套实现可随时切换
- 密码使用 **bcrypt 哈希**存储，登录签发随机 token（30 天有效，存 `sessions` 表）

## 本地开发

1. 启动 MySQL，执行建库脚本：

   ```bash
   mysql -uroot -p < db/schema.sql
   ```

2. 复制 `.env.example` 为 `.env.local`，填入 MySQL 连接信息（已被 .gitignore 忽略，不会提交）：

   ```
   NEXT_PUBLIC_API_MODE=remote
   MYSQL_HOST=127.0.0.1
   MYSQL_PORT=3306
   MYSQL_USER=root
   MYSQL_PASSWORD=你的密码
   MYSQL_DATABASE=flowai
   ```

3. 启动开发服务器：

   ```bash
   pnpm install
   pnpm dev
   ```

## API 一览

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /api/auth/register | 注册（email/password/name） |
| POST | /api/auth/login | 登录，返回 `{ user, token }` |
| POST | /api/auth/logout | 登出 |
| GET | /api/auth/me | 当前登录用户 |
| GET/POST | /api/todos | 待办列表 / 新建 |
| PATCH/DELETE | /api/todos/:id | 更新 / 删除待办 |
| GET/POST | /api/health?type=water\|weight\|diet\|workout\|sleep\|settings | 健康数据读/写 |
| PATCH/DELETE | /api/health/:id?type=workout\|sleep\|... | 更新 / 删除健康记录 |
| GET/POST | /api/notify/settings | 通知设置读/写 |

除登录/注册外，所有接口需要请求头 `Authorization: Bearer <token>`。

## 表结构

见 `db/schema.sql`，共 10 张表：
`users` `sessions` `todos` `water_days` `weight_entries` `diet_entries`
`workout_entries` `sleep_entries` `health_settings` `notify_settings`

## 部署到 Vercel（生产环境）

> ⚠️ **Vercel 云函数无法访问你本机的 MySQL**。生产环境必须使用**云端 MySQL**（腾讯云 MySQL / TiDB Cloud / Railway / Aiven 等），把连接信息填成 Vercel 环境变量即可，代码无需改动。

在 Vercel 项目 Settings → Environment Variables 添加：

```
NEXT_PUBLIC_API_MODE=remote
MYSQL_HOST=<云端数据库地址>
MYSQL_PORT=3306
MYSQL_USER=<用户名>
MYSQL_PASSWORD=<密码>
MYSQL_DATABASE=flowai
```

然后在云端数据库执行一次 `db/schema.sql` 即可上线。
