import { format } from "date-fns";

export function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage full or private mode
  }
}

export function genId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function todayKey(d = new Date()): string {
  return format(d, "yyyy-MM-dd");
}

export function formatDateLabel(dateKey: string): string {
  return format(new Date(dateKey + "T00:00:00"), "MM/dd");
}
