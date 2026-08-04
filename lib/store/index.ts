// 数据访问层入口：根据 API_MODE 返回实现。
// - local（默认）：LocalStore，纯前端 localStorage mock
// - remote：RemoteStore，通过 Next.js API Route + MySQL 读写真实后端
import { API_MODE } from "@/lib/config";
import { createLocalStore } from "./local";
import { createRemoteStore } from "./remote";
import type { Store } from "./types";

let _store: Store | null = null;

export function getStore(): Store {
  if (_store) return _store;
  switch (API_MODE) {
    case "remote":
      _store = createRemoteStore();
      break;
    default:
      _store = createLocalStore();
  }
  return _store;
}

export type {
  User,
  Store,
  AuthStore,
  TodosStore,
  HealthStore,
  NotifyStore,
  AuthResult,
  SleepInput,
  NotesStore,
  Notebook,
  Note,
  NoteSummary,
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
} from "./types";
