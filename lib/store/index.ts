// 数据访问层入口：根据 API_MODE 返回实现。
// 当前恒为 LocalStore（纯前端 localStorage mock）。
// 未来接真实后端时，在此根据 API_MODE === "remote" 返回 RemoteStore 即可，页面零改动。

import { API_MODE } from "@/lib/config";
import { createLocalStore } from "./local";
import type { Store } from "./types";

let _store: Store | null = null;

export function getStore(): Store {
  if (_store) return _store;
  switch (API_MODE) {
    case "remote":
      // TODO: _store = createRemoteStore(); // 接真实后端时启用
      _store = createLocalStore();
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
