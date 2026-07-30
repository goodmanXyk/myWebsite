// 统一数据访问层类型定义。
// 未来接真实后端时，只需在 lib/store 提供 RemoteStore 实现同一组接口，页面无需改动。

import type { Todo, TodoPriority, TodoStatus } from "@/lib/todos";
import type {
  MealType,
  WaterDay,
  WeightEntry,
  DietEntry,
  WorkoutEntry,
  SleepQuality,
  SleepEntry,
  HealthSettings,
} from "@/lib/health";
import type { WebhookKind, NotificationSettings, PushPayload } from "@/lib/notify";

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: number;
}

export type AuthResult = { ok: boolean; error?: string; user?: User };

export interface AuthStore {
  login(email: string, password: string): Promise<AuthResult>;
  register(email: string, password: string, name?: string): Promise<AuthResult>;
  logout(): void;
  getSession(): User | null;
  // 预留：微信登录 / 绑定邮箱（本期未启用）
  loginWithWechat(profile: {
    openid: string;
    unionid?: string;
    nickname?: string;
    avatar?: string;
  }): Promise<AuthResult>;
  bindEmail(
    userId: string,
    email: string,
    password: string
  ): Promise<AuthResult>;
}

export interface TodosStore {
  get(userId: string): Todo[];
  save(userId: string, list: Todo[]): void;
  add(
    userId: string,
    data: Omit<Todo, "id" | "userId" | "createdAt" | "status" | "completedAt">
  ): Todo;
  update(userId: string, id: string, patch: Partial<Todo>): void;
  remove(userId: string, id: string): void;
  toggle(userId: string, id: string): void;
}

export type SleepInput = {
  date?: string;
  bedtime: string;
  wakeTime: string;
  quality: SleepQuality;
  note?: string;
};

export interface HealthStore {
  getSettings(userId: string): HealthSettings;
  saveSettings(userId: string, settings: HealthSettings): void;
  // 饮水
  getWaterDays(userId: string): WaterDay[];
  saveWaterDays(userId: string, days: WaterDay[]): void;
  addWater(userId: string, amountMl: number, date?: string): void;
  // 体重
  getWeightEntries(userId: string): WeightEntry[];
  addWeightEntry(
    userId: string,
    kg: number,
    date?: string,
    note?: string
  ): WeightEntry;
  deleteWeightEntry(userId: string, id: string): void;
  // 饮食
  getDietEntries(userId: string, date?: string): DietEntry[];
  addDietEntry(
    userId: string,
    meal: MealType,
    food: string,
    calories?: number,
    date?: string
  ): DietEntry;
  deleteDietEntry(userId: string, id: string): void;
  // 健身
  getWorkoutEntries(userId: string, date?: string): WorkoutEntry[];
  addWorkoutEntry(
    userId: string,
    activity: string,
    durationMin: number,
    date?: string
  ): WorkoutEntry;
  updateWorkoutEntry(
    userId: string,
    id: string,
    patch: Partial<WorkoutEntry>
  ): void;
  deleteWorkoutEntry(userId: string, id: string): void;
  // 睡眠
  getSleepEntries(userId: string): SleepEntry[];
  addSleepEntry(userId: string, data: SleepInput): SleepEntry;
  updateSleepEntry(userId: string, id: string, patch: Partial<SleepEntry>): void;
  deleteSleepEntry(userId: string, id: string): void;
}

export interface NotifyStore {
  getSettings(userId: string): NotificationSettings;
  saveSettings(userId: string, settings: NotificationSettings): void;
  simulatePush(kind: WebhookKind, payload: PushPayload): void;
}

export interface Store {
  auth: AuthStore;
  todos: TodosStore;
  health: HealthStore;
  notify: NotifyStore;
}

// 重新导出领域类型，方便页面从 @/lib/store 统一引用。
export type {
  Todo,
  TodoPriority,
  TodoStatus,
  MealType,
  WaterDay,
  WeightEntry,
  DietEntry,
  WorkoutEntry,
  SleepQuality,
  SleepEntry,
  HealthSettings,
  WebhookKind,
  NotificationSettings,
  PushPayload,
};
