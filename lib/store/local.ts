// LocalStore：当前阶段的默认实现，内部复用现有 lib/todos、lib/health、lib/notify 的
// localStorage 逻辑，行为与原先 100% 一致。鉴权用户存储逻辑从 lib/auth.tsx 迁移至此。

import { readJSON, writeJSON, genId } from "@/lib/storage";
import * as todos from "@/lib/todos";
import * as health from "@/lib/health";
import * as notify from "@/lib/notify";
import type {
  User,
  AuthResult,
  AuthStore,
  TodosStore,
  HealthStore,
  NotifyStore,
  Store,
} from "./types";

const USERS_KEY = "aiwf_users";
const SESSION_KEY = "aiwf_session";

interface StoredUser extends User {
  password: string;
}

function readUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function readSession(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const authStore: AuthStore = {
  async login(email, password) {
    const users = readUsers();
    const found = users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (!found || found.password !== password) {
      return { ok: false, error: "邮箱或密码不正确" };
    }
    const { password: _pw, ...safe } = found;
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(safe));
    return { ok: true, user: safe };
  },

  async register(email, password, name) {
    const cleanEmail = email.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      return { ok: false, error: "请输入有效的邮箱地址" };
    }
    if (password.length < 6) {
      return { ok: false, error: "密码至少需要 6 位" };
    }
    const users = readUsers();
    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { ok: false, error: "该邮箱已注册，请直接登录" };
    }
    const newUser: StoredUser = {
      id: genId(),
      email: cleanEmail,
      name: name?.trim() || cleanEmail.split("@")[0],
      password,
      createdAt: Date.now(),
    };
    users.push(newUser);
    writeUsers(users);
    const { password: _pw, ...safe } = newUser;
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(safe));
    return { ok: true, user: safe };
  },

  logout() {
    window.localStorage.removeItem(SESSION_KEY);
  },

  getSession() {
    return readSession();
  },

  // 预留接口，本期未启用
  async loginWithWechat(): Promise<AuthResult> {
    return { ok: false, error: "微信登录尚未启用" };
  },

  async bindEmail(): Promise<AuthResult> {
    return { ok: false, error: "邮箱绑定尚未启用" };
  },
};

const todosStore: TodosStore = {
  get: (userId) => todos.getTodos(userId),
  save: (userId, list) => todos.saveTodos(userId, list),
  add: (userId, data) => todos.addTodo(userId, data),
  update: (userId, id, patch) => todos.updateTodo(userId, id, patch),
  remove: (userId, id) => todos.deleteTodo(userId, id),
  toggle: (userId, id) => todos.toggleTodo(userId, id),
};

const healthStore: HealthStore = {
  getSettings: (userId) => health.getHealthSettings(userId),
  saveSettings: (userId, settings) => health.saveHealthSettings(userId, settings),
  getWaterDays: (userId) => health.getWaterDays(userId),
  saveWaterDays: (userId, days) => health.saveWaterDays(userId, days),
  addWater: (userId, amountMl, date) => health.addWater(userId, amountMl, date),
  getWeightEntries: (userId) => health.getWeightEntries(userId),
  addWeightEntry: (userId, kg, date, note) =>
    health.addWeightEntry(userId, kg, date, note),
  deleteWeightEntry: (userId, id) => health.deleteWeightEntry(userId, id),
  getDietEntries: (userId, date) => health.getDietEntries(userId, date),
  addDietEntry: (userId, meal, food, calories, date) =>
    health.addDietEntry(userId, meal, food, calories, date),
  deleteDietEntry: (userId, id) => health.deleteDietEntry(userId, id),
  getWorkoutEntries: (userId, date) => health.getWorkoutEntries(userId, date),
  addWorkoutEntry: (userId, activity, durationMin, date) =>
    health.addWorkoutEntry(userId, activity, durationMin, date),
  updateWorkoutEntry: (userId, id, patch) =>
    health.updateWorkoutEntry(userId, id, patch),
  deleteWorkoutEntry: (userId, id) => health.deleteWorkoutEntry(userId, id),
  getSleepEntries: (userId) => health.getSleepEntries(userId),
  addSleepEntry: (userId, data) => health.addSleepEntry(userId, data),
  updateSleepEntry: (userId, id, patch) =>
    health.updateSleepEntry(userId, id, patch),
  deleteSleepEntry: (userId, id) => health.deleteSleepEntry(userId, id),
};

const notifyStore: NotifyStore = {
  getSettings: (userId) => notify.getNotificationSettings(userId),
  saveSettings: (userId, settings) =>
    notify.saveNotificationSettings(userId, settings),
  simulatePush: (kind, payload) => notify.simulatePush(kind, payload),
};

export function createLocalStore(): Store {
  return {
    auth: authStore,
    todos: todosStore,
    health: healthStore,
    notify: notifyStore,
  };
}
