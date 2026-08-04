// 统一数据访问层类型定义。
// local 实现：LocalStore（localStorage）；remote 实现：RemoteStore（调用 Next.js API + MySQL）。
// 所有数据方法均为异步，页面通过 await 获取数据。

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
import type { Notebook, Note, NoteSummary } from "@/lib/notes";

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
  get(userId: string): Promise<Todo[]>;
  save(userId: string, list: Todo[]): Promise<void>;
  add(
    userId: string,
    data: Omit<Todo, "id" | "userId" | "createdAt" | "status" | "completedAt">
  ): Promise<Todo>;
  update(userId: string, id: string, patch: Partial<Todo>): Promise<void>;
  remove(userId: string, id: string): Promise<void>;
  toggle(userId: string, id: string): Promise<void>;
}

export type SleepInput = {
  date?: string;
  bedtime: string;
  wakeTime: string;
  quality: SleepQuality;
  note?: string;
};

export interface HealthStore {
  getSettings(userId: string): Promise<HealthSettings>;
  saveSettings(userId: string, settings: HealthSettings): Promise<void>;
  // 饮水
  getWaterDays(userId: string): Promise<WaterDay[]>;
  saveWaterDays(userId: string, days: WaterDay[]): Promise<void>;
  addWater(userId: string, amountMl: number, date?: string): Promise<void>;
  // 体重
  getWeightEntries(userId: string): Promise<WeightEntry[]>;
  addWeightEntry(
    userId: string,
    kg: number,
    date?: string,
    note?: string
  ): Promise<WeightEntry>;
  deleteWeightEntry(userId: string, id: string): Promise<void>;
  // 饮食
  getDietEntries(userId: string, date?: string): Promise<DietEntry[]>;
  addDietEntry(
    userId: string,
    meal: MealType,
    food: string,
    calories?: number,
    date?: string
  ): Promise<DietEntry>;
  deleteDietEntry(userId: string, id: string): Promise<void>;
  // 健身
  getWorkoutEntries(userId: string, date?: string): Promise<WorkoutEntry[]>;
  addWorkoutEntry(
    userId: string,
    activity: string,
    durationMin: number,
    date?: string
  ): Promise<WorkoutEntry>;
  updateWorkoutEntry(
    userId: string,
    id: string,
    patch: Partial<WorkoutEntry>
  ): Promise<void>;
  deleteWorkoutEntry(userId: string, id: string): Promise<void>;
  // 睡眠
  getSleepEntries(userId: string): Promise<SleepEntry[]>;
  addSleepEntry(userId: string, data: SleepInput): Promise<SleepEntry>;
  updateSleepEntry(userId: string, id: string, patch: Partial<SleepEntry>): Promise<void>;
  deleteSleepEntry(userId: string, id: string): Promise<void>;
}

export interface NotifyStore {
  getSettings(userId: string): Promise<NotificationSettings>;
  saveSettings(userId: string, settings: NotificationSettings): Promise<void>;
  simulatePush(kind: WebhookKind, payload: PushPayload): void;
}

export interface NotesStore {
  getNotebooks(userId: string): Promise<Notebook[]>;
  addNotebook(userId: string, name: string): Promise<Notebook>;
  updateNotebook(userId: string, id: string, name: string): Promise<void>;
  removeNotebook(userId: string, id: string): Promise<void>;
  getNotes(userId: string, notebookId?: string | null): Promise<NoteSummary[]>;
  getNote(userId: string, id: string): Promise<Note | null>;
  addNote(
    userId: string,
    data: { title: string; content?: string; notebookId?: string | null }
  ): Promise<Note>;
  updateNote(
    userId: string,
    id: string,
    patch: Partial<Pick<Note, "title" | "content" | "notebookId">>
  ): Promise<void>;
  removeNote(userId: string, id: string): Promise<void>;
  importNote(
    userId: string,
    data: { file: File; notebookId?: string | null }
  ): Promise<Note>;
}

export interface Store {
  auth: AuthStore;
  todos: TodosStore;
  health: HealthStore;
  notify: NotifyStore;
  notes: NotesStore;
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
  Notebook,
  Note,
  NoteSummary,
};
