import crypto from "crypto";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/lib/server/db";
import { fail, json, readBody } from "@/lib/server/respond";
import { requireUser } from "@/lib/server/auth";

type HealthType = "water" | "weight" | "diet" | "workout" | "sleep" | "settings";
const TYPES: HealthType[] = ["water", "weight", "diet", "workout", "sleep", "settings"];

function getType(req: Request): HealthType | null {
  const t = new URL(req.url).searchParams.get("type");
  return t && TYPES.includes(t as HealthType) ? (t as HealthType) : null;
}

// ---------- GET ----------
export async function GET(req: Request) {
  const user = await requireUser(req);
  if (!user) return fail("未登录", 401);
  const uid = user.id;
  const type = getType(req);

  const num = (v: unknown) => (v != null ? Number(v) : null);
  const dateParam = new URL(req.url).searchParams.get("date");

  const loadWater = async () => {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT date, amount_ml, glasses FROM water_days WHERE user_id = ? ORDER BY date",
      [uid]
    );
    return rows.map((r) => ({ date: r.date, amountMl: Number(r.amount_ml), glasses: Number(r.glasses) }));
  };
  const loadWeight = async () => {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT id, date, kg, note, created_at FROM weight_entries WHERE user_id = ? ORDER BY created_at ASC",
      [uid]
    );
    return rows.map((r) => ({ id: r.id, date: r.date, kg: Number(r.kg), note: r.note ?? undefined, createdAt: num(r.created_at) }));
  };
  const loadDiet = async () => {
    const [rows] = dateParam
      ? await pool.execute<RowDataPacket[]>(
          "SELECT id, date, meal, food, calories, created_at FROM diet_entries WHERE user_id = ? AND date = ? ORDER BY created_at ASC",
          [uid, dateParam]
        )
      : await pool.execute<RowDataPacket[]>(
          "SELECT id, date, meal, food, calories, created_at FROM diet_entries WHERE user_id = ? ORDER BY created_at ASC",
          [uid]
        );
    return rows.map((r) => ({ id: r.id, date: r.date, meal: r.meal, food: r.food, calories: num(r.calories), createdAt: num(r.created_at) }));
  };
  const loadWorkout = async () => {
    const [rows] = dateParam
      ? await pool.execute<RowDataPacket[]>(
          "SELECT id, date, activity, duration_min, done, created_at FROM workout_entries WHERE user_id = ? AND date = ? ORDER BY created_at ASC",
          [uid, dateParam]
        )
      : await pool.execute<RowDataPacket[]>(
          "SELECT id, date, activity, duration_min, done, created_at FROM workout_entries WHERE user_id = ? ORDER BY created_at ASC",
          [uid]
        );
    return rows.map((r) => ({ id: r.id, date: r.date, activity: r.activity, durationMin: Number(r.duration_min), done: Boolean(r.done), createdAt: num(r.created_at) }));
  };
  const loadSleep = async () => {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT id, date, bedtime, wake_time, duration_min, quality, note, created_at FROM sleep_entries WHERE user_id = ? ORDER BY date ASC, created_at ASC",
      [uid]
    );
    return rows.map((r) => ({ id: r.id, date: r.date, bedtime: r.bedtime, wakeTime: r.wake_time, durationMin: Number(r.duration_min), quality: r.quality, note: r.note ?? undefined, createdAt: num(r.created_at) }));
  };
  const loadSettings = async () => {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT water_target_ml FROM health_settings WHERE user_id = ?",
      [uid]
    );
    return { waterTargetMl: rows.length ? Number(rows[0].water_target_ml) : 2000 };
  };

  if (type === "water") return json({ ok: true, data: await loadWater() });
  if (type === "weight") return json({ ok: true, data: await loadWeight() });
  if (type === "diet") return json({ ok: true, data: await loadDiet() });
  if (type === "workout") return json({ ok: true, data: await loadWorkout() });
  if (type === "sleep") return json({ ok: true, data: await loadSleep() });
  if (type === "settings") return json({ ok: true, data: await loadSettings() });

  // 无 type：一次性返回全部（供 Dashboard 汇总）
  const [waterDays, weightEntries, dietEntries, workoutEntries, sleepEntries, settings] =
    await Promise.all([
      loadWater(),
      loadWeight(),
      loadDiet(),
      loadWorkout(),
      loadSleep(),
      loadSettings(),
    ]);
  return json({ ok: true, data: { waterDays, weightEntries, dietEntries, workoutEntries, sleepEntries, settings } });
}

// ---------- POST ----------
export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return fail("未登录", 401);
  const uid = user.id;
  const type = getType(req);
  if (!type) return fail("缺少 type 参数", 400);
  const body = await readBody(req);

  // 饮水：支持 replace=1 整表替换（对应 saveWaterDays）
  if (type === "water") {
    if (new URL(req.url).searchParams.get("replace") === "1") {
      const days = Array.isArray(body.days) ? (body.days as Array<{ date: string; amountMl?: number; glasses?: number }>) : [];
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        await conn.execute("DELETE FROM water_days WHERE user_id = ?", [uid]);
        for (const d of days) {
          if (!d.date) continue;
          await conn.execute(
            "INSERT INTO water_days (user_id, date, amount_ml, glasses) VALUES (?, ?, ?, ?)",
            [uid, d.date, Number(d.amountMl || 0), Number(d.glasses || 0)]
          );
        }
        await conn.commit();
      } catch (e) {
        await conn.rollback();
        throw e;
      } finally {
        conn.release();
      }
      return json({ ok: true });
    }

    const date = String(body.date ?? "");
    const amountMl = Number(body.amountMl || 0);
    if (!date || amountMl <= 0) return fail("参数不完整（date / amountMl）", 400);
    const glasses = Math.round(amountMl / 250);
    await pool.execute(
      `INSERT INTO water_days (user_id, date, amount_ml, glasses) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE amount_ml = amount_ml + VALUES(amount_ml), glasses = glasses + VALUES(glasses)`,
      [uid, date, amountMl, glasses]
    );
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT date, amount_ml, glasses FROM water_days WHERE user_id = ? AND date = ?",
      [uid, date]
    );
    const r = rows[0];
    return json({ ok: true, data: { date: r.date, amountMl: Number(r.amount_ml), glasses: Number(r.glasses) } });
  }

  if (type === "settings") {
    const waterTargetMl = Math.max(0, Number(body.waterTargetMl || 0));
    if (!waterTargetMl) return fail("饮水目标无效", 400);
    await pool.execute(
      `INSERT INTO health_settings (user_id, water_target_ml) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE water_target_ml = VALUES(water_target_ml)`,
      [uid, waterTargetMl]
    );
    return json({ ok: true, data: { waterTargetMl } });
  }

  const now = Date.now();
  const id = crypto.randomUUID();

  if (type === "weight") {
    const date = String(body.date ?? "");
    const kg = Number(body.kg);
    const note = body.note ? String(body.note) : null;
    if (!date || !(kg > 0)) return fail("参数不完整（date / kg）", 400);
    await pool.execute(
      "INSERT INTO weight_entries (id, user_id, date, kg, note, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [id, uid, date, kg, note, now]
    );
    return json({ ok: true, data: { id, date, kg, note: note ?? undefined, createdAt: now } });
  }

  if (type === "diet") {
    const date = String(body.date ?? "");
    const meal = String(body.meal ?? "");
    const food = String(body.food ?? "").trim();
    if (!date || !["breakfast", "lunch", "dinner", "snack"].includes(meal) || !food) {
      return fail("参数不完整（date / meal / food）", 400);
    }
    const calories = body.calories != null && body.calories !== "" ? Number(body.calories) : null;
    await pool.execute(
      "INSERT INTO diet_entries (id, user_id, date, meal, food, calories, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, uid, date, meal, food, calories, now]
    );
    return json({ ok: true, data: { id, date, meal, food, calories, createdAt: now } });
  }

  if (type === "workout") {
    const date = String(body.date ?? "");
    const activity = String(body.activity ?? "").trim();
    const durationMin = Number(body.durationMin || 0);
    if (!date || !activity || !(durationMin > 0)) return fail("参数不完整（date / activity / durationMin）", 400);
    const done = Boolean(body.done);
    await pool.execute(
      "INSERT INTO workout_entries (id, user_id, date, activity, duration_min, done, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, uid, date, activity, durationMin, done ? 1 : 0, now]
    );
    return json({ ok: true, data: { id, date, activity, durationMin, done, createdAt: now } });
  }

  if (type === "sleep") {
    const date = String(body.date ?? "");
    const bedtime = String(body.bedtime ?? "");
    const wakeTime = String(body.wakeTime ?? "");
    const durationMin = Number(body.durationMin || 0);
    if (!date || !bedtime || !wakeTime || !(durationMin > 0)) {
      return fail("参数不完整（date / bedtime / wakeTime / durationMin）", 400);
    }
    const quality = ["good", "fair", "poor"].includes(String(body.quality)) ? String(body.quality) : "fair";
    const note = body.note ? String(body.note) : null;
    await pool.execute(
      "INSERT INTO sleep_entries (id, user_id, date, bedtime, wake_time, duration_min, quality, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, uid, date, bedtime, wakeTime, durationMin, quality, note, now]
    );
    return json({ ok: true, data: { id, date, bedtime, wakeTime, durationMin, quality, note: note ?? undefined, createdAt: now } });
  }

  return fail("不支持的 type", 400);
}
