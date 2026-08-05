// RemoteStore：真实后端实现。所有数据通过 Next.js API Route 读写 MySQL。
// 页面代码无需改动调用方式（与 LocalStore 同一套接口），只是所有方法变为异步。
import type {
  AuthResult,
  AuthStore,
  HealthStore,
  NotifyStore,
  Store,
  TodosStore,
  User,
  SleepInput,
} from "./types";
import type {
  Todo,
  MealType,
  WaterDay,
  WeightEntry,
  DietEntry,
  WorkoutEntry,
  SleepEntry,
  HealthSettings,
  NotificationSettings,
  Notebook,
  Note,
  NoteSummary,
  NotesStore,
} from "./types";

const TOKEN_KEY = "aiwf_token";
const SESSION_KEY = "aiwf_session";

// ---------- 基础工具 ----------
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

function readCachedUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function cacheUser(user: User | null) {
  if (typeof window === "undefined") return;
  if (user) window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else window.localStorage.removeItem(SESSION_KEY);
}

// 统一请求：非 2xx 或业务失败时抛错
async function api<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {};
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  if (!isFormData) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || `请求失败 (${res.status})`);
  }
  return data as T;
}

// 认证接口需要返回错误而不是抛异常
async function apiSoft(path: string, options: RequestInit = {}): Promise<any> {
  try {
    const data = await api<any>(path, options);
    return data;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "请求失败" };
  }
}

// ---------- Auth ----------
const authStore: AuthStore = {
  async login(email, password) {
    const data = await apiSoft("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (data.ok && data.user && data.token) {
      setToken(data.token);
      cacheUser(data.user);
      return { ok: true, user: data.user };
    }
    return { ok: false, error: data.error || "登录失败" };
  },

  async register(email, password, name) {
    const data = await apiSoft("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
    if (data.ok && data.user && data.token) {
      setToken(data.token);
      cacheUser(data.user);
      return { ok: true, user: data.user };
    }
    return { ok: false, error: data.error || "注册失败" };
  },

  logout() {
    const token = getToken();
    if (token) {
      fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => undefined);
    }
    setToken(null);
    cacheUser(null);
  },

  getSession() {
    return readCachedUser();
  },

  // 预留接口，本期未启用
  async loginWithWechat(): Promise<AuthResult> {
    return { ok: false, error: "微信登录尚未启用" };
  },

  async bindEmail(): Promise<AuthResult> {
    return { ok: false, error: "邮箱绑定尚未启用" };
  },
};

// ---------- Todos ----------
const todosStore: TodosStore = {
  async get() {
    const data = await api<{ todos: Todo[] }>("/api/todos");
    return data.todos;
  },
  async save() {
    // 远程模式下无需整体覆盖；LocalStore 兼容接口保留为空实现
    return;
  },
  async add(_userId, data) {
    const res = await api<{ todo: Todo }>("/api/todos", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.todo;
  },
  async update(_userId, id, patch) {
    await api(`/api/todos/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  },
  async remove(_userId, id) {
    await api(`/api/todos/${id}`, { method: "DELETE" });
  },
  async toggle(_userId, id) {
    // 页面会先读取当前 todo 状态，这里需要拿到最新状态再翻转。
    // 为保持接口简单，由页面通过 update 完成 toggle；此处保留但先查询。
    const data = await api<{ todos: Todo[] }>("/api/todos");
    const t = data.todos.find((x) => x.id === id);
    if (!t) return;
    const completed = t.status === "completed";
    await api(`/api/todos/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: completed ? "pending" : "completed",
        completedAt: completed ? null : Date.now(),
      }),
    });
  },
};

// ---------- Health ----------
const healthStore: HealthStore = {
  async getSettings() {
    const data = await api<{ data: HealthSettings }>("/api/health?type=settings");
    return data.data;
  },
  async saveSettings(_userId, settings) {
    await api("/api/health?type=settings", {
      method: "POST",
      body: JSON.stringify(settings),
    });
  },

  async getWaterDays() {
    const data = await api<{ data: WaterDay[] }>("/api/health?type=water");
    return data.data;
  },
  async saveWaterDays(_userId, days) {
    await api("/api/health?type=water&replace=1", {
      method: "POST",
      body: JSON.stringify({ days }),
    });
  },
  async addWater(_userId, amountMl, date) {
    await api("/api/health?type=water", {
      method: "POST",
      body: JSON.stringify({ amountMl, date }),
    });
  },

  async getWeightEntries() {
    const data = await api<{ data: WeightEntry[] }>("/api/health?type=weight");
    return data.data;
  },
  async addWeightEntry(_userId, kg, date, note) {
    const data = await api<{ data: WeightEntry }>("/api/health?type=weight", {
      method: "POST",
      body: JSON.stringify({ kg, date, note }),
    });
    return data.data;
  },
  async deleteWeightEntry(_userId, id) {
    await api(`/api/health/${id}?type=weight`, { method: "DELETE" });
  },

  async getDietEntries(_userId, date) {
    const q = date ? `&date=${encodeURIComponent(date)}` : "";
    const data = await api<{ data: DietEntry[] }>(`/api/health?type=diet${q}`);
    return data.data;
  },
  async addDietEntry(_userId, meal: MealType, food, calories, date) {
    const data = await api<{ data: DietEntry }>("/api/health?type=diet", {
      method: "POST",
      body: JSON.stringify({ meal, food, calories, date }),
    });
    return data.data;
  },
  async deleteDietEntry(_userId, id) {
    await api(`/api/health/${id}?type=diet`, { method: "DELETE" });
  },

  async getWorkoutEntries(_userId, date) {
    const q = date ? `&date=${encodeURIComponent(date)}` : "";
    const data = await api<{ data: WorkoutEntry[] }>(`/api/health?type=workout${q}`);
    return data.data;
  },
  async addWorkoutEntry(_userId, activity, durationMin, date) {
    const data = await api<{ data: WorkoutEntry }>("/api/health?type=workout", {
      method: "POST",
      body: JSON.stringify({ activity, durationMin, date }),
    });
    return data.data;
  },
  async updateWorkoutEntry(_userId, id, patch) {
    await api(`/api/health/${id}?type=workout`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  },
  async deleteWorkoutEntry(_userId, id) {
    await api(`/api/health/${id}?type=workout`, { method: "DELETE" });
  },

  async getSleepEntries() {
    const data = await api<{ data: SleepEntry[] }>("/api/health?type=sleep");
    return data.data;
  },
  async addSleepEntry(_userId, data: SleepInput) {
    const res = await api<{ data: SleepEntry }>("/api/health?type=sleep", {
      method: "POST",
      body: JSON.stringify({
        ...data,
        durationMin: computeSleepDuration(data.bedtime, data.wakeTime),
      }),
    });
    return res.data;
  },
  async updateSleepEntry(_userId, id, patch) {
    await api(`/api/health/${id}?type=sleep`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  },
  async deleteSleepEntry(_userId, id) {
    await api(`/api/health/${id}?type=sleep`, { method: "DELETE" });
  },
};

// 与 LocalStore 一致：跨午夜自动 +24h
function computeSleepDuration(bedtime: string, wakeTime: string): number {
  const [bh, bm] = bedtime.split(":").map(Number);
  const [wh, wm] = wakeTime.split(":").map(Number);
  let bed = bh * 60 + bm;
  let wake = wh * 60 + wm;
  if (wake <= bed) wake += 24 * 60;
  return wake - bed;
}

// ---------- Notes（个人知识库）----------
const notesStore: NotesStore = {
  async getNotebooks() {
    const data = await api<{ notebooks: Notebook[] }>("/api/notebooks");
    return data.notebooks;
  },
  async addNotebook(_userId, name) {
    const data = await api<{ notebook: Notebook }>("/api/notebooks", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    return data.notebook;
  },
  async updateNotebook(_userId, id, name) {
    await api(`/api/notebooks/${id}`, { method: "PATCH", body: JSON.stringify({ name }) });
  },
  async removeNotebook(_userId, id) {
    await api(`/api/notebooks/${id}`, { method: "DELETE" });
  },
  async getNotes(_userId, notebookId) {
    const q =
      notebookId === null
        ? "?notebookId=null"
        : notebookId
          ? `?notebookId=${encodeURIComponent(notebookId)}`
          : "";
    const data = await api<{ notes: NoteSummary[] }>(`/api/notes${q}`);
    return data.notes;
  },
  async getNote(_userId, id) {
    const data = await api<{ note: Note }>(`/api/notes/${id}`);
    return data.note;
  },
  async addNote(_userId, data) {
    const res = await api<{ note: Note }>("/api/notes", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.note;
  },
  async updateNote(_userId, id, patch) {
    await api(`/api/notes/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
  },
  async removeNote(_userId, id) {
    await api(`/api/notes/${id}`, { method: "DELETE" });
  },
  async importNote(_userId, { file, notebookId }) {
    const form = new FormData();
    form.append("file", file);
    if (notebookId) form.append("notebookId", notebookId);
    const data = await api<{ note: Note }>("/api/notes/import", {
      method: "POST",
      body: form,
    });
    return data.note;
  },
};

// ---------- Notify ----------
const notifyStore: NotifyStore = {
  async getSettings() {
    const data = await api<{ data: NotificationSettings }>("/api/notify/settings");
    return data.data;
  },
  async saveSettings(_userId, settings) {
    await api("/api/notify/settings", {
      method: "POST",
      body: JSON.stringify(settings),
    });
  },
  async sendTest() {
    try {
      const data = await api<{ data: { email: string; wecom?: string } }>(
        "/api/notify/test",
        { method: "POST" }
      );
      return { ok: true, data: data.data };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "发送失败" };
    }
  },
};

export function createRemoteStore(): Store {
  return {
    auth: authStore,
    todos: todosStore,
    health: healthStore,
    notify: notifyStore,
    notes: notesStore,
  };
}
