// LocalStore：本地 localStorage 实现（API_MODE !== "remote" 时使用）。
// 所有方法已按接口改造为异步（Promise），行为与原先完全一致。
// 鉴权用户存储逻辑从 lib/auth.tsx 迁移至此。

import { readJSON, writeJSON, genId } from "@/lib/storage";
import * as todos from "@/lib/todos";
import * as health from "@/lib/health";
import * as notify from "@/lib/notify";
import * as notes from "@/lib/notes";
import type {
  User,
  AuthResult,
  AuthStore,
  TodosStore,
  HealthStore,
  NotifyStore,
  NotesStore,
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

  async register(email, password, name, _code) {
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

  async sendCode(_email, _purpose) {
    return { ok: true, message: "本地演示模式：验证码已模拟发送" };
  },

  async resetPassword(email, code, password) {
    const cleanEmail = email.trim().toLowerCase();
    const users = readUsers();
    const idx = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);
    if (idx === -1) return { ok: false, error: "该邮箱未注册" };
    if (password.length < 6) return { ok: false, error: "新密码至少需要 6 位" };
    if (!code) return { ok: false, error: "请输入验证码" };
    users[idx].password = password;
    writeUsers(users);
    return { ok: true, message: "密码已重置，请使用新密码登录" };
  },

  async changePassword(oldPassword, newPassword) {
    const session = window.localStorage.getItem(SESSION_KEY);
    if (!session) return { ok: false, error: "未登录" };
    const current = JSON.parse(session) as { id: string };
    const users = readUsers();
    const idx = users.findIndex((u) => u.id === current.id);
    if (idx === -1) return { ok: false, error: "用户不存在" };
    if (users[idx].password !== oldPassword) return { ok: false, error: "当前密码不正确" };
    if (newPassword.length < 6) return { ok: false, error: "新密码至少需要 6 位" };
    users[idx].password = newPassword;
    writeUsers(users);
    window.localStorage.removeItem(SESSION_KEY);
    return { ok: true, message: "密码已修改，请重新登录" };
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
  async get(userId) {
    return todos.getTodos(userId);
  },
  async save(userId, list) {
    todos.saveTodos(userId, list);
  },
  async add(userId, data) {
    return todos.addTodo(userId, data);
  },
  async update(userId, id, patch) {
    todos.updateTodo(userId, id, patch);
  },
  async remove(userId, id) {
    todos.deleteTodo(userId, id);
  },
  async toggle(userId, id) {
    todos.toggleTodo(userId, id);
  },
};

const healthStore: HealthStore = {
  async getSettings(userId) {
    return health.getHealthSettings(userId);
  },
  async saveSettings(userId, settings) {
    health.saveHealthSettings(userId, settings);
  },
  async getWaterDays(userId) {
    return health.getWaterDays(userId);
  },
  async saveWaterDays(userId, days) {
    health.saveWaterDays(userId, days);
  },
  async addWater(userId, amountMl, date) {
    health.addWater(userId, amountMl, date);
  },
  async getWeightEntries(userId) {
    return health.getWeightEntries(userId);
  },
  async addWeightEntry(userId, kg, date, note) {
    return health.addWeightEntry(userId, kg, date, note);
  },
  async deleteWeightEntry(userId, id) {
    health.deleteWeightEntry(userId, id);
  },
  async getDietEntries(userId, date) {
    return health.getDietEntries(userId, date);
  },
  async addDietEntry(userId, meal, food, calories, date) {
    return health.addDietEntry(userId, meal, food, calories, date);
  },
  async deleteDietEntry(userId, id) {
    health.deleteDietEntry(userId, id);
  },
  async getWorkoutEntries(userId, date) {
    return health.getWorkoutEntries(userId, date);
  },
  async addWorkoutEntry(userId, activity, durationMin, date) {
    return health.addWorkoutEntry(userId, activity, durationMin, date);
  },
  async updateWorkoutEntry(userId, id, patch) {
    health.updateWorkoutEntry(userId, id, patch);
  },
  async deleteWorkoutEntry(userId, id) {
    health.deleteWorkoutEntry(userId, id);
  },
  async getSleepEntries(userId) {
    return health.getSleepEntries(userId);
  },
  async addSleepEntry(userId, data) {
    return health.addSleepEntry(userId, data);
  },
  async updateSleepEntry(userId, id, patch) {
    health.updateSleepEntry(userId, id, patch);
  },
  async deleteSleepEntry(userId, id) {
    health.deleteSleepEntry(userId, id);
  },
};

const notifyStore: NotifyStore = {
  async getSettings(userId) {
    return notify.getNotificationSettings(userId);
  },
  async saveSettings(userId, settings) {
    notify.saveNotificationSettings(userId, settings);
  },
  async sendTest() {
    return {
      ok: true,
      data: { email: "本地演示模式：模拟发送成功（未连接真实 SMTP）" },
    };
  },
};

const notesStore: NotesStore = {
  async getNotebooks(userId) {
    return notes.getNotebooks(userId);
  },
  async addNotebook(userId, name) {
    return notes.addNotebook(userId, name);
  },
  async updateNotebook(userId, id, name) {
    notes.updateNotebook(userId, id, name);
  },
  async removeNotebook(userId, id) {
    notes.deleteNotebook(userId, id);
  },
  async getNotes(userId, notebookId) {
    return notes.getNotes(userId, notebookId);
  },
  async getNote(userId, id) {
    return notes.getNote(userId, id);
  },
  async addNote(userId, data) {
    return notes.addNote(userId, data);
  },
  async updateNote(userId, id, patch) {
    notes.updateNote(userId, id, patch);
  },
  async removeNote(userId, id) {
    notes.deleteNote(userId, id);
  },
  async importNote(userId, { file, notebookId }) {
    const name = file.name || "导入文档";
    const ext = (name.split(".").pop() || "").toLowerCase();
    if (!["md", "markdown", "txt"].includes(ext)) {
      throw new Error("本地演示模式仅支持 md / txt 导入，Word / Excel / PDF 请使用线上版本");
    }
    const content = await file.text();
    return notes.addNote(userId, {
      title: name.replace(/\.[^.]+$/, "") || "导入文档",
      content,
      notebookId: notebookId ?? null,
    });
  },
};

export function createLocalStore(): Store {
  return {
    auth: authStore,
    todos: todosStore,
    health: healthStore,
    notify: notifyStore,
    notes: notesStore,
  };
}
