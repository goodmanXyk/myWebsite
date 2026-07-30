import { readJSON, writeJSON, genId, todayKey } from "./storage";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface WaterDay {
  date: string; // YYYY-MM-DD
  amountMl: number;
  glasses: number;
}

export interface WeightEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  kg: number;
  note?: string;
  createdAt: number;
}

export interface DietEntry {
  id: string;
  userId: string;
  date: string;
  meal: MealType;
  food: string;
  calories?: number;
  createdAt: number;
}

export interface WorkoutEntry {
  id: string;
  userId: string;
  date: string;
  activity: string;
  durationMin: number;
  done: boolean;
  createdAt: number;
}

export type SleepQuality = "good" | "fair" | "poor";

export interface SleepEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD（按起床日期归到该天）
  bedtime: string; // "HH:MM" 上床/入睡时间
  wakeTime: string; // "HH:MM" 起床时间
  durationMin: number; // 睡眠时长（分钟，自动按跨午夜计算）
  quality: SleepQuality;
  note?: string;
  createdAt: number;
}

export interface HealthSettings {
  waterTargetMl: number;
}

const waterKey = (userId: string) => `aiwf_health_water_${userId}`;
const weightKey = (userId: string) => `aiwf_health_weight_${userId}`;
const dietKey = (userId: string) => `aiwf_health_diet_${userId}`;
const workoutKey = (userId: string) => `aiwf_health_workout_${userId}`;
const sleepKey = (userId: string) => `aiwf_health_sleep_${userId}`;
const settingsKey = (userId: string) => `aiwf_health_settings_${userId}`;

const defaultSettings: HealthSettings = { waterTargetMl: 2000 };

export function getHealthSettings(userId: string): HealthSettings {
  return readJSON<HealthSettings>(settingsKey(userId), defaultSettings);
}

export function saveHealthSettings(userId: string, settings: HealthSettings) {
  writeJSON(settingsKey(userId), settings);
}

// Water
export function getWaterDays(userId: string): WaterDay[] {
  return readJSON<WaterDay[]>(waterKey(userId), []);
}

export function saveWaterDays(userId: string, days: WaterDay[]) {
  writeJSON(waterKey(userId), days);
}

export function addWater(userId: string, amountMl: number, date?: string) {
  const days = getWaterDays(userId);
  const dayKey = date || todayKey();
  const idx = days.findIndex((d) => d.date === dayKey);
  if (idx >= 0) {
    days[idx].amountMl += amountMl;
    days[idx].glasses = Math.round((days[idx].amountMl / 250) * 10) / 10;
  } else {
    days.push({
      date: dayKey,
      amountMl,
      glasses: Math.round((amountMl / 250) * 10) / 10,
    });
  }
  saveWaterDays(userId, days);
}

// Weight
export function getWeightEntries(userId: string): WeightEntry[] {
  return readJSON<WeightEntry[]>(weightKey(userId), []).sort(
    (a, b) => new Date(a.date + "T00:00:00").getTime() - new Date(b.date + "T00:00:00").getTime()
  );
}

export function addWeightEntry(
  userId: string,
  kg: number,
  date?: string,
  note?: string
) {
  const list = getWeightEntries(userId);
  const entry: WeightEntry = {
    id: genId(),
    userId,
    date: date || todayKey(),
    kg,
    note,
    createdAt: Date.now(),
  };
  list.push(entry);
  writeJSON(weightKey(userId), list);
  return entry;
}

export function deleteWeightEntry(userId: string, id: string) {
  const list = getWeightEntries(userId).filter((e) => e.id !== id);
  writeJSON(weightKey(userId), list);
}

// Diet
export function getDietEntries(userId: string, date?: string): DietEntry[] {
  const list = readJSON<DietEntry[]>(dietKey(userId), []);
  if (date) return list.filter((e) => e.date === date);
  return list.sort((a, b) => b.createdAt - a.createdAt);
}

export function addDietEntry(
  userId: string,
  meal: MealType,
  food: string,
  calories?: number,
  date?: string
) {
  const list = readJSON<DietEntry[]>(dietKey(userId), []);
  const entry: DietEntry = {
    id: genId(),
    userId,
    date: date || todayKey(),
    meal,
    food,
    calories,
    createdAt: Date.now(),
  };
  list.push(entry);
  writeJSON(dietKey(userId), list);
  return entry;
}

export function deleteDietEntry(userId: string, id: string) {
  const list = readJSON<DietEntry[]>(dietKey(userId), []).filter(
    (e) => e.id !== id
  );
  writeJSON(dietKey(userId), list);
}

// Workout
export function getWorkoutEntries(userId: string, date?: string): WorkoutEntry[] {
  const list = readJSON<WorkoutEntry[]>(workoutKey(userId), []);
  if (date) return list.filter((e) => e.date === date);
  return list.sort((a, b) => b.createdAt - a.createdAt);
}

export function addWorkoutEntry(
  userId: string,
  activity: string,
  durationMin: number,
  date?: string
) {
  const list = readJSON<WorkoutEntry[]>(workoutKey(userId), []);
  const entry: WorkoutEntry = {
    id: genId(),
    userId,
    date: date || todayKey(),
    activity,
    durationMin,
    done: false,
    createdAt: Date.now(),
  };
  list.push(entry);
  writeJSON(workoutKey(userId), list);
  return entry;
}

export function updateWorkoutEntry(
  userId: string,
  id: string,
  patch: Partial<WorkoutEntry>
) {
  const list = readJSON<WorkoutEntry[]>(workoutKey(userId), []);
  const idx = list.findIndex((e) => e.id === id);
  if (idx === -1) return;
  list[idx] = { ...list[idx], ...patch };
  writeJSON(workoutKey(userId), list);
}

export function deleteWorkoutEntry(userId: string, id: string) {
  const list = readJSON<WorkoutEntry[]>(workoutKey(userId), []).filter(
    (e) => e.id !== id
  );
  writeJSON(workoutKey(userId), list);
}

// Sleep
function computeDurationMin(bedtime: string, wakeTime: string): number {
  const [bh, bm] = bedtime.split(":").map(Number);
  const [wh, wm] = wakeTime.split(":").map(Number);
  let bed = bh * 60 + bm;
  let wake = wh * 60 + wm;
  if (wake <= bed) wake += 24 * 60; // 跨午夜
  return wake - bed;
}

export function getSleepEntries(userId: string): SleepEntry[] {
  return readJSON<SleepEntry[]>(sleepKey(userId), []).sort(
    (a, b) =>
      new Date(a.date + "T00:00:00").getTime() -
      new Date(b.date + "T00:00:00").getTime()
  );
}

export function addSleepEntry(
  userId: string,
  data: {
    date?: string;
    bedtime: string;
    wakeTime: string;
    quality: SleepQuality;
    note?: string;
  }
) {
  const list = getSleepEntries(userId);
  const entry: SleepEntry = {
    id: genId(),
    userId,
    date: data.date || todayKey(),
    bedtime: data.bedtime,
    wakeTime: data.wakeTime,
    durationMin: computeDurationMin(data.bedtime, data.wakeTime),
    quality: data.quality,
    note: data.note,
    createdAt: Date.now(),
  };
  list.push(entry);
  writeJSON(sleepKey(userId), list);
  return entry;
}

export function updateSleepEntry(
  userId: string,
  id: string,
  patch: Partial<SleepEntry>
) {
  const list = readJSON<SleepEntry[]>(sleepKey(userId), []);
  const idx = list.findIndex((e) => e.id === id);
  if (idx === -1) return;
  const merged = { ...list[idx], ...patch };
  if (patch.bedtime || patch.wakeTime) {
    merged.durationMin = computeDurationMin(merged.bedtime, merged.wakeTime);
  }
  list[idx] = merged;
  writeJSON(sleepKey(userId), list);
}

export function deleteSleepEntry(userId: string, id: string) {
  const list = readJSON<SleepEntry[]>(sleepKey(userId), []).filter(
    (e) => e.id !== id
  );
  writeJSON(sleepKey(userId), list);
}
