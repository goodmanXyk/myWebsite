-- ============================================================
-- FlowAI 后端数据库 Schema（MySQL）
-- 数据库：flowai  |  字符集：utf8mb4
-- 时间戳统一使用 BIGINT（毫秒），与前端 LocalStore 数据格式保持一致
-- ============================================================

CREATE DATABASE IF NOT EXISTS flowai
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE flowai;

-- 用户表（密码使用 bcrypt 哈希存储）
CREATE TABLE IF NOT EXISTS users (
  id            VARCHAR(36)  PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(100) NULL,
  created_at    BIGINT       NOT NULL
) ENGINE=InnoDB;

-- 登录会话表（随机 token，30 天有效期）
CREATE TABLE IF NOT EXISTS sessions (
  token      VARCHAR(64) PRIMARY KEY,
  user_id    VARCHAR(36) NOT NULL,
  created_at BIGINT      NOT NULL,
  expires_at BIGINT      NOT NULL,
  KEY idx_sessions_user (user_id),
  KEY idx_sessions_expires (expires_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 待办
CREATE TABLE IF NOT EXISTS todos (
  id           VARCHAR(36) PRIMARY KEY,
  user_id      VARCHAR(36) NOT NULL,
  title        VARCHAR(255) NOT NULL,
  description  TEXT NULL,
  due          BIGINT NULL,
  priority     ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
  status       ENUM('pending','completed') NOT NULL DEFAULT 'pending',
  created_at   BIGINT NOT NULL,
  completed_at BIGINT NULL,
  reminder_sent_at BIGINT NULL,        -- 最近一次提醒发送时间（幂等标记，改期后重置）
  KEY idx_todos_user (user_id, created_at),
  CONSTRAINT fk_todos_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 健康：饮水
CREATE TABLE IF NOT EXISTS water_days (
  user_id   VARCHAR(36) NOT NULL,
  date      VARCHAR(10) NOT NULL,          -- YYYY-MM-DD
  amount_ml INT NOT NULL DEFAULT 0,
  glasses   INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, date),
  CONSTRAINT fk_water_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 健康：体重
CREATE TABLE IF NOT EXISTS weight_entries (
  id         VARCHAR(36) PRIMARY KEY,
  user_id    VARCHAR(36) NOT NULL,
  date       VARCHAR(10) NOT NULL,
  kg         DECIMAL(6,2) NOT NULL,
  note       VARCHAR(255) NULL,
  created_at BIGINT NOT NULL,
  KEY idx_weight_user (user_id, date),
  CONSTRAINT fk_weight_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 健康：饮食
CREATE TABLE IF NOT EXISTS diet_entries (
  id         VARCHAR(36) PRIMARY KEY,
  user_id    VARCHAR(36) NOT NULL,
  date       VARCHAR(10) NOT NULL,
  meal       ENUM('breakfast','lunch','dinner','snack') NOT NULL,
  food       VARCHAR(255) NOT NULL,
  calories   INT NULL,
  created_at BIGINT NOT NULL,
  KEY idx_diet_user (user_id, date),
  CONSTRAINT fk_diet_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 健康：健身
CREATE TABLE IF NOT EXISTS workout_entries (
  id           VARCHAR(36) PRIMARY KEY,
  user_id      VARCHAR(36) NOT NULL,
  date         VARCHAR(10) NOT NULL,
  activity     VARCHAR(255) NOT NULL,
  duration_min INT NOT NULL,
  done         TINYINT(1) NOT NULL DEFAULT 0,
  created_at   BIGINT NOT NULL,
  KEY idx_workout_user (user_id, date),
  CONSTRAINT fk_workout_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 健康：睡眠
CREATE TABLE IF NOT EXISTS sleep_entries (
  id          VARCHAR(36) PRIMARY KEY,
  user_id     VARCHAR(36) NOT NULL,
  date        VARCHAR(10) NOT NULL,
  bedtime     VARCHAR(5) NOT NULL,         -- HH:MM
  wake_time   VARCHAR(5) NOT NULL,         -- HH:MM
  duration_min INT NOT NULL,
  quality     ENUM('good','fair','poor') NOT NULL DEFAULT 'fair',
  note        VARCHAR(255) NULL,
  created_at  BIGINT NOT NULL,
  KEY idx_sleep_user (user_id, date),
  CONSTRAINT fk_sleep_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 健康：设置（饮水目标等）
CREATE TABLE IF NOT EXISTS health_settings (
  user_id         VARCHAR(36) PRIMARY KEY,
  water_target_ml INT NOT NULL DEFAULT 2000,
  CONSTRAINT fk_health_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 通知设置（企业微信 / 钉钉 webhook）
CREATE TABLE IF NOT EXISTS notify_settings (
  user_id          VARCHAR(36) PRIMARY KEY,
  enabled          TINYINT(1) NOT NULL DEFAULT 1,
  lead_minutes     INT NOT NULL DEFAULT 0,
  wecom_webhook    VARCHAR(500) NULL,
  dingtalk_webhook VARCHAR(500) NULL,
  CONSTRAINT fk_notify_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 个人知识库（Markdown 笔记）
-- ============================================================

-- 知识库（文件夹/目录）
CREATE TABLE IF NOT EXISTS notebooks (
  id         VARCHAR(36)  PRIMARY KEY,
  user_id    VARCHAR(36)  NOT NULL,
  name       VARCHAR(100) NOT NULL,
  sort_order INT          NOT NULL DEFAULT 0,
  created_at BIGINT       NOT NULL,
  updated_at BIGINT       NOT NULL,
  KEY idx_notebooks_user (user_id, sort_order),
  CONSTRAINT fk_notebooks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 文档（Markdown 笔记）
CREATE TABLE IF NOT EXISTS notes (
  id          VARCHAR(36)  PRIMARY KEY,
  user_id     VARCHAR(36)  NOT NULL,
  notebook_id VARCHAR(36)  NULL,            -- NULL = 未分类
  title       VARCHAR(255) NOT NULL,
  content     MEDIUMTEXT   NULL,            -- Markdown 源码
  sort_order  INT          NOT NULL DEFAULT 0,
  created_at  BIGINT       NOT NULL,
  updated_at  BIGINT       NOT NULL,
  KEY idx_notes_user (user_id, notebook_id, updated_at),
  CONSTRAINT fk_notes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notes_notebook FOREIGN KEY (notebook_id) REFERENCES notebooks(id) ON DELETE SET NULL
) ENGINE=InnoDB;
