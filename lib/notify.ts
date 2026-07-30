import { readJSON, writeJSON } from "./storage";

export type WebhookKind = "wecom" | "dingtalk";

export interface NotificationSettings {
  enabled: boolean;
  leadMinutes: number; // 提前提醒分钟数
  webhooks: Partial<Record<WebhookKind, string>>;
}

export interface PushPayload {
  type: "todo_reminder";
  title: string;
  body: string;
  due?: number;
  webhooks: Partial<Record<WebhookKind, string>>;
}

const notifyKey = (userId: string) => `aiwf_notify_settings_${userId}`;

const defaultSettings: NotificationSettings = {
  enabled: true,
  leadMinutes: 0,
  webhooks: {},
};

export function getNotificationSettings(userId: string): NotificationSettings {
  return readJSON<NotificationSettings>(notifyKey(userId), defaultSettings);
}

export function saveNotificationSettings(
  userId: string,
  settings: NotificationSettings
) {
  writeJSON(notifyKey(userId), settings);
}

export function simulatePush(kind: WebhookKind, payload: PushPayload) {
  // eslint-disable-next-line no-console
  console.log(`[simulatePush:${kind}]`, JSON.stringify(payload, null, 2));
}
