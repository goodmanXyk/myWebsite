// 服务端 MySQL 连接池（仅服务端使用，勿在客户端 import）。
// 在 Next.js serverless 环境下使用全局单例避免热重载/冷启动时连接泄漏。
import mysql from "mysql2/promise";

declare global {
  // eslint-disable-next-line no-var
  var __flowaiPool: mysql.Pool | undefined;
}

const pool =
  globalThis.__flowaiPool ??
  mysql.createPool({
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "flowai",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: "utf8mb4",
    timezone: "+08:00",
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__flowaiPool = pool;
}

export { pool };
