"use client";

import { useEffect, useMemo, useState } from "react";
import { subDays, addDays, format } from "date-fns";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { getStore } from "@/lib/store";
import type {
  HealthSettings,
  MealType,
  SleepEntry,
  SleepQuality,
  WaterDay,
  WeightEntry,
  DietEntry,
  WorkoutEntry,
} from "@/lib/store";
import { todayKey } from "@/lib/storage";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dropdown } from "@/components/ui/Dropdown";
import { DatePicker } from "@/components/ui/DatePicker";
import { Card } from "@/components/ui/Card";
import { ProgressCircle } from "@/components/ui/charts/ProgressCircle";
import { LineTrend } from "@/components/ui/charts/LineTrend";
import { BarTrend } from "@/components/ui/charts/BarTrend";

const store = getStore();

type Tab = "water" | "weight" | "diet" | "workout" | "sleep" | "weekly";

const tabs: { key: Tab; label: string; icon: string }[] = [
  { key: "water", label: "饮水", icon: "💧" },
  { key: "weight", label: "体重", icon: "⚖️" },
  { key: "diet", label: "饮食", icon: "🍱" },
  { key: "workout", label: "健身计划", icon: "🏋️" },
  { key: "sleep", label: "睡眠作息", icon: "💤" },
  { key: "weekly", label: "周总结", icon: "📊" },
];

const mealOptions: { value: MealType; label: string }[] = [
  { value: "breakfast", label: "早餐 / Breakfast" },
  { value: "lunch", label: "午餐 / Lunch" },
  { value: "dinner", label: "晚餐 / Dinner" },
  { value: "snack", label: "加餐 / Snack" },
];

const mealLabel: Record<MealType, string> = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
  snack: "加餐",
};

const qualityLabel: Record<SleepQuality, string> = {
  good: "好",
  fair: "中",
  poor: "差",
};

const qualityBadge: Record<SleepQuality, string> = {
  good: "bg-brand/10 text-brand border border-brand/30",
  fair: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
  poor: "bg-red-500/10 text-red-400 border border-red-500/30",
};

function fmtDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h} 小时 ${m} 分` : `${m} 分`;
}

function lastNDays(n: number): string[] {
  const out: string[] = [];
  const base = new Date();
  for (let i = n - 1; i >= 0; i--) {
    out.push(todayKey(subDays(base, i)));
  }
  return out;
}

function fullDateLabel(key: string): string {
  return format(new Date(key + "T00:00:00"), "yyyy年M月d日 (EEE)");
}

function shortDateLabel(key: string): string {
  return format(new Date(key + "T00:00:00"), "M月d日 (EEE)");
}

export default function HealthPage() {
  const { user } = useAuth();
  const { show } = useToast();
  const [tab, setTab] = useState<Tab>("water");
  const [loaded, setLoaded] = useState(false);

  // 选定日期（默认今天），让模块不再局限于当天
  const [selectedDate, setSelectedDate] = useState<string>(todayKey());

  // 四个数据集全量载入 state（替代每次操作强制重读 localStorage）
  const [waterDays, setWaterDays] = useState<WaterDay[]>([]);
  const [weightList, setWeightList] = useState<WeightEntry[]>([]);
  const [dietList, setDietList] = useState<DietEntry[]>([]);
  const [workoutList, setWorkoutList] = useState<WorkoutEntry[]>([]);
  const [sleepList, setSleepList] = useState<SleepEntry[]>([]);
  const [waterSettings, setWaterSettings] = useState<HealthSettings>({ waterTargetMl: 2000 });

  const loadAll = async () => {
    if (!user) return;
    const uid = user.id;
    try {
      const [w, wt, d, wo, s, hs] = await Promise.all([
        store.health.getWaterDays(uid),
        store.health.getWeightEntries(uid),
        store.health.getDietEntries(uid),
        store.health.getWorkoutEntries(uid),
        store.health.getSleepEntries(uid),
        store.health.getSettings(uid),
      ]);
      setWaterDays(w);
      setWeightList(wt);
      setDietList(d);
      setWorkoutList(wo);
      setSleepList(s);
      setWaterSettings(hs);
    } catch (e) {
      console.error("加载健康数据失败", e);
    }
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      await loadAll();
      setLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) return null;
  const uid = user.id;
  const days7 = useMemo(() => lastNDays(7), []);
  const isToday = selectedDate === todayKey();
  const dayLabel = (s: string) => (isToday ? `今日${s}` : `${shortDateLabel(selectedDate)} ${s}`);

  // 按 selectedDate 派生
  const dayWater = waterDays.find((d) => d.date === selectedDate);
  const dayDiet = dietList.filter((e) => e.date === selectedDate);
  const dayWorkout = workoutList.filter((e) => e.date === selectedDate);
  const daySleep = sleepList.filter((e) => e.date === selectedDate);

  // ===== Water =====
  const todayMl = dayWater?.amountMl ?? 0;
  const waterPercent = waterSettings.waterTargetMl
    ? (todayMl / waterSettings.waterTargetMl) * 100
    : 0;
  const water7 = days7.map((d) => {
    const found = waterDays.find((w) => w.date === d);
    return { label: format(new Date(d + "T00:00:00"), "MM/dd"), value: found?.amountMl ?? 0 };
  });
  const [customMl, setCustomMl] = useState(250);

  const handleAddWater = async (ml: number) => {
    try {
      await store.health.addWater(uid, ml, selectedDate);
      show(`${isToday ? "今日" : shortDateLabel(selectedDate)} 已记录饮水 ${ml}ml 💧`, "success");
      await loadAll();
    } catch (e) {
      show(e instanceof Error ? e.message : "记录失败", "warning");
    }
  };

  // ===== Weight =====
  const latestWeight = weightList[weightList.length - 1];
  const weightTrend = weightList.slice(-14).map((e) => ({
    label: format(new Date(e.date + "T00:00:00"), "MM/dd"),
    value: e.kg,
  }));
  const [weightKg, setWeightKg] = useState("");
  const [weightNote, setWeightNote] = useState("");

  const handleAddWeight = async () => {
    const kg = parseFloat(weightKg);
    if (isNaN(kg) || kg <= 0) {
      show("请输入有效体重", "warning");
      return;
    }
    try {
      await store.health.addWeightEntry(uid, kg, selectedDate, weightNote.trim() || undefined);
      setWeightKg("");
      setWeightNote("");
      show(`已记录体重 ${kg}kg ⚖️`, "success");
      await loadAll();
    } catch (e) {
      show(e instanceof Error ? e.message : "记录失败", "warning");
    }
  };

  // ===== Diet =====
  const dietCalories = dayDiet.reduce((s, d) => s + (d.calories ?? 0), 0);
  const dietByMeal: Record<MealType, typeof dayDiet> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  };
  dayDiet.forEach((d) => dietByMeal[d.meal].push(d));
  const dietMealBar = (["breakfast", "lunch", "dinner", "snack"] as MealType[]).map((m) => ({
    label: mealLabel[m],
    value: dietByMeal[m].reduce((s, d) => s + (d.calories ?? 0), 0),
  }));
  const [dietMeal, setDietMeal] = useState<MealType>("breakfast");
  const [dietFood, setDietFood] = useState("");
  const [dietCal, setDietCal] = useState("");

  const handleAddDiet = async () => {
    if (!dietFood.trim()) {
      show("请输入食物名称", "warning");
      return;
    }
    const cal = dietCal.trim() ? parseFloat(dietCal) : undefined;
    try {
      await store.health.addDietEntry(uid, dietMeal, dietFood.trim(), isNaN(cal as number) ? undefined : cal, selectedDate);
      setDietFood("");
      setDietCal("");
      show("已记录饮食 🍱", "success");
      await loadAll();
    } catch (e) {
      show(e instanceof Error ? e.message : "记录失败", "warning");
    }
  };

  // ===== Workout =====
  const workoutDone = dayWorkout.filter((w) => w.done).length;
  const workoutMinToday = dayWorkout
    .filter((w) => w.done)
    .reduce((s, w) => s + w.durationMin, 0);
  const workout7 = days7.map((d) => {
    const list = workoutList.filter((w) => w.date === d && w.done);
    return {
      label: format(new Date(d + "T00:00:00"), "MM/dd"),
      value: list.reduce((s, w) => s + w.durationMin, 0),
    };
  });
  const [workoutName, setWorkoutName] = useState("");
  const [workoutMin, setWorkoutMin] = useState("");

  const handleAddWorkout = async () => {
    if (!workoutName.trim()) {
      show("请输入运动项目", "warning");
      return;
    }
    const min = parseFloat(workoutMin);
    if (isNaN(min) || min <= 0) {
      show("请输入有效时长(分钟)", "warning");
      return;
    }
    try {
      await store.health.addWorkoutEntry(uid, workoutName.trim(), min, selectedDate);
      setWorkoutName("");
      setWorkoutMin("");
      show("已添加健身计划 🏋️", "success");
      await loadAll();
    } catch (e) {
      show(e instanceof Error ? e.message : "添加失败", "warning");
    }
  };

  // ===== Sleep =====
  const sleep7 = days7.map((d) => {
    const e = sleepList.find((s) => s.date === d);
    return {
      label: format(new Date(d + "T00:00:00"), "MM/dd"),
      value: e ? +(e.durationMin / 60).toFixed(1) : 0,
    };
  });
  const [bedtime, setBedtime] = useState("23:00");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [sleepQuality, setSleepQuality] = useState<SleepQuality>("good");
  const [sleepNote, setSleepNote] = useState("");

  const handleAddSleep = async () => {
    if (!bedtime || !wakeTime) {
      show("请填写入睡与起床时间", "warning");
      return;
    }
    try {
      await store.health.addSleepEntry(uid, {
        date: selectedDate,
        bedtime,
        wakeTime,
        quality: sleepQuality,
        note: sleepNote.trim() || undefined,
      });
      setSleepNote("");
      show("已记录睡眠 💤", "success");
      await loadAll();
    } catch (e) {
      show(e instanceof Error ? e.message : "记录失败", "warning");
    }
  };

  // 未来 7 天规划（含今天）
  const future7 = useMemo(() => {
    const arr: { key: string; workouts: typeof dayWorkout; diet: typeof dayDiet }[] = [];
    for (let i = 0; i < 7; i++) {
      const key = todayKey(addDays(new Date(), i));
      arr.push({
        key,
        workouts: workoutList.filter((w) => !w.done && w.date === key),
        diet: dietList.filter((d) => d.date === key),
      });
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutList, dietList]);

  const hasFuturePlan = future7.some((d) => d.workouts.length > 0 || d.diet.length > 0);

  // ===== 周总结（过去 7 天）=====
  const weekly = useMemo(() => {
    const inWeek = (date: string) => days7.includes(date);
    const waterInWeek = waterDays.filter((d) => inWeek(d.date));
    const totalWater = waterInWeek.reduce((s, d) => s + d.amountMl, 0);
    const waterAvg = days7.length ? Math.round(totalWater / days7.length) : 0;

    const weightInWeek = weightList.filter((e) => inWeek(e.date));
    const wFirst = weightInWeek[0];
    const wLast = weightInWeek[weightInWeek.length - 1];
    const weightChange =
      wFirst && wLast && weightInWeek.length >= 2
        ? +(wLast.kg - wFirst.kg).toFixed(1)
        : null;
    const latestWeight = weightList.length
      ? weightList[weightList.length - 1].kg
      : null;

    const dietInWeek = dietList.filter((e) => inWeek(e.date));
    const totalCal = dietInWeek.reduce((s, d) => s + (d.calories ?? 0), 0);
    const dietAvg = Math.round(totalCal / 7);

    const sleepInWeek = sleepList.filter((e) => inWeek(e.date));
    const avgSleepMin = sleepInWeek.length
      ? sleepInWeek.reduce((s, e) => s + e.durationMin, 0) / sleepInWeek.length
      : 0;
    const avgSleepH = +(avgSleepMin / 60).toFixed(1);
    const qScore = sleepInWeek.length
      ? sleepInWeek.reduce(
          (s, e) => s + (e.quality === "good" ? 3 : e.quality === "fair" ? 2 : 1),
          0
        ) / sleepInWeek.length
      : 0;
    const qualityLabelAvg =
      qScore >= 2.5 ? "良好" : qScore >= 1.5 ? "一般" : qScore > 0 ? "偏差" : "—";

    const workoutInWeek = workoutList.filter((e) => inWeek(e.date) && e.done);
    const totalWorkoutMin = workoutInWeek.reduce((s, e) => s + e.durationMin, 0);
    const trainedDays = new Set(workoutInWeek.map((e) => e.date)).size;

    const waterChart = days7.map((d) => ({
      label: format(new Date(d + "T00:00:00"), "MM/dd"),
      value: waterDays.find((w) => w.date === d)?.amountMl ?? 0,
    }));
    const weightChart = days7.map((d) => {
      const e = weightList.find((w) => w.date === d);
      return {
        label: format(new Date(d + "T00:00:00"), "MM/dd"),
        value: e ? e.kg : null,
      };
    });
    const dietChart = days7.map((d) => ({
      label: format(new Date(d + "T00:00:00"), "MM/dd"),
      value: dietList
        .filter((x) => x.date === d)
        .reduce((s, x) => s + (x.calories ?? 0), 0),
    }));
    const sleepChart = days7.map((d) => {
      const e = sleepList.find((s) => s.date === d);
      return {
        label: format(new Date(d + "T00:00:00"), "MM/dd"),
        value: e ? +(e.durationMin / 60).toFixed(1) : 0,
      };
    });
    const workoutChart = days7.map((d) => ({
      label: format(new Date(d + "T00:00:00"), "MM/dd"),
      value: workoutList
        .filter((w) => w.date === d && w.done)
        .reduce((s, w) => s + w.durationMin, 0),
    }));

    const report: string[] = [];
    if (waterAvg >= waterSettings.waterTargetMl) {
      report.push(`💧 日均饮水约 ${waterAvg} ml，已达成 ${waterSettings.waterTargetMl} ml 目标，保持得不错。`);
    } else if (waterInWeek.length === 0) {
      report.push("💧 本周暂无饮水记录，建议每天记录并喝够水。");
    } else {
      report.push(`💧 日均饮水约 ${waterAvg} ml，低于目标 ${waterSettings.waterTargetMl} ml，记得多补水。`);
    }
    if (weightChange !== null) {
      const trend =
        weightChange < 0
          ? `下降 ${Math.abs(weightChange)} kg`
          : weightChange > 0
          ? `上升 ${weightChange} kg`
          : "基本平稳";
      report.push(`⚖️ 本周体重${trend}（最新 ${latestWeight} kg）。`);
    } else {
      report.push("⚖️ 本周体重记录不足 2 天，暂无法判断趋势，建议每天固定时间称重。");
    }
    if (dietInWeek.length === 0) {
      report.push("🍱 本周暂无饮食记录。");
    } else if (dietAvg > 2500) {
      report.push(`🍱 日均热量约 ${dietAvg} kcal，略偏高，注意控制总热量摄入。`);
    } else {
      report.push(`🍱 日均热量约 ${dietAvg} kcal，处于合理区间。`);
    }
    if (sleepInWeek.length === 0) {
      report.push("💤 本周暂无睡眠记录。");
    } else {
      const sleepDesc = avgSleepH >= 7 ? "充足" : avgSleepH >= 6 ? "略不足" : "严重不足";
      report.push(`💤 平均睡眠 ${avgSleepH} 小时（${sleepDesc}），质量${qualityLabelAvg}。`);
      if (avgSleepH < 7) report.push("  建议尽量在 23 点前入睡，保证 7 小时以上睡眠。");
    }
    if (trainedDays === 0) {
      report.push("🏋️ 本周还没有训练记录，建议每周至少运动 3 次。");
    } else if (trainedDays >= 4) {
      report.push(`🏋️ 本周训练 ${trainedDays} 天、累计 ${totalWorkoutMin} 分钟，运动频次优秀，继续保持！`);
    } else {
      report.push(`🏋️ 本周训练 ${trainedDays} 天、累计 ${totalWorkoutMin} 分钟，可再增加 1-2 次。`);
    }

    return {
      waterAvg,
      target: waterSettings.waterTargetMl,
      weightChange,
      latestWeight,
      dietAvg,
      avgSleepH,
      qualityLabelAvg,
      totalWorkoutMin,
      trainedDays,
      sleepCount: sleepInWeek.length,
      days: days7.length,
      waterChart,
      weightChart,
      dietChart,
      sleepChart,
      workoutChart,
      report,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waterDays, weightList, dietList, sleepList, workoutList, days7, waterSettings]);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-ink">Body Healthy</h1>
        <p className="mt-1 text-sm text-muted">
          Body Healthy · 按任意日期记录与规划饮水 / 体重 / 饮食 / 睡眠 / 健身
        </p>
      </div>

      {/* 共享日期选择器 */}
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
        <DatePicker value={selectedDate} onChange={setSelectedDate} className="w-44" />
        <Button variant="ghost" onClick={() => setSelectedDate(todayKey())}>
          今天
        </Button>
        <span className="text-sm text-muted">{fullDateLabel(selectedDate)}</span>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible md:pb-0">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 whitespace-nowrap rounded-lg border px-4 py-2 text-sm transition-colors ${
              tab === t.key
                ? "border-ink bg-white text-black"
                : "border-line bg-surface text-muted hover:text-ink"
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {!loaded ? (
        <p className="py-12 text-center text-sm text-muted">加载中…</p>
      ) : (
        <>
          {tab === "water" && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Card className="flex flex-col items-center justify-center gap-2">
                  <ProgressCircle
                    percent={waterPercent}
                    label={`${todayMl} ml`}
                    sublabel={`目标 ${waterSettings.waterTargetMl} ml`}
                  />
                  <p className="text-xs text-muted">
                    {dayLabel("已喝约")} {dayWater?.glasses ?? 0} 杯（按 250ml/杯）
                  </p>
                </Card>
                <Card className="flex flex-col gap-3 justify-center">
                  <p className="text-sm font-medium text-ink">快速加水</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[250, 500, 750].map((m) => (
                      <Button key={m} variant="secondary" onClick={() => handleAddWater(m)}>
                        +{m}ml
                      </Button>
                    ))}
                  </div>
                  <div className="flex items-end gap-2">
                    <Input
                      type="number"
                      min={1}
                      value={customMl}
                      onChange={(e) => setCustomMl(Number(e.target.value))}
                      label="自定义 (ml)"
                    />
                    <Button onClick={() => handleAddWater(customMl)}>+ 记录</Button>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-line">
                    <Input
                      type="number"
                      min={1}
                      defaultValue={waterSettings.waterTargetMl}
                      label="每日目标 (ml)"
                      id="waterTarget"
                    />
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        const v = Number(
                          (document.getElementById("waterTarget") as HTMLInputElement).value
                        );
                        if (v > 0) {
                          try {
                            await store.health.saveSettings(uid, { waterTargetMl: v });
                            show("已更新饮水目标", "success");
                            await loadAll();
                          } catch (e) {
                            show(e instanceof Error ? e.message : "保存失败", "warning");
                          }
                        }
                      }}
                    >
                      保存目标
                    </Button>
                  </div>
                </Card>
              </div>
              <Card>
                <p className="mb-1 text-sm font-medium text-ink">近 7 天饮水 (ml)</p>
                <p className="mb-2 text-xs text-muted">（截至今天）</p>
                <BarTrend data={water7} label="饮水量(ml)" />
              </Card>
            </div>
          )}

          {tab === "weight" && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Card className="flex flex-col gap-3">
                  <p className="text-sm font-medium text-ink">
                    {isToday ? "记录今日体重" : `记录 ${shortDateLabel(selectedDate)} 体重`}
                  </p>
                  <Input
                    type="number"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    label="体重 (kg)"
                    placeholder="例如 65.5"
                  />
                  <Input
                    value={weightNote}
                    onChange={(e) => setWeightNote(e.target.value)}
                    label="备注 (可选)"
                    placeholder="例如 晨起空腹"
                  />
                  <Button onClick={handleAddWeight}>+ 记录体重</Button>
                  <div className="border-t border-line pt-3">
                    <p className="text-sm text-muted">
                      最新体重：
                      <span className="text-lg font-semibold text-ink">
                        {latestWeight ? `${latestWeight.kg} kg` : "—"}
                      </span>
                    </p>
                  </div>
                </Card>
                <Card>
                  <p className="mb-1 text-sm font-medium text-ink">体重趋势 (近 14 次)</p>
                  <p className="mb-2 text-xs text-muted">（截至今天）</p>
                  {weightTrend.length === 0 ? (
                    <p className="py-12 text-center text-xs text-muted">暂无数据</p>
                  ) : (
                    <LineTrend data={weightTrend} label="体重(kg)" />
                  )}
                </Card>
              </div>
              <Card>
                <p className="mb-3 text-sm font-medium text-ink">历史记录</p>
                {weightList.length === 0 ? (
                  <p className="text-xs text-muted">暂无记录</p>
                ) : (
                  <ul className="flex flex-col divide-y divide-line">
                    {[...weightList].reverse().map((e) => (
                      <li key={e.id} className="flex items-center justify-between py-2 text-sm">
                        <span className="text-ink">
                          {format(new Date(e.date + "T00:00:00"), "yyyy/MM/dd")} · {e.kg} kg
                          {e.note ? <span className="text-muted"> · {e.note}</span> : null}
                        </span>
                        <button
                          onClick={async () => {
                            try {
                              await store.health.deleteWeightEntry(uid, e.id);
                              await loadAll();
                            } catch (err) {
                              show(err instanceof Error ? err.message : "删除失败", "warning");
                            }
                          }}
                          className="inline-flex items-center rounded-lg border border-red-500/15 px-2.5 py-1 text-xs text-red-400 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
                        >
                          删除
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          )}

          {tab === "diet" && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Card className="flex flex-col gap-3">
                  <p className="text-sm font-medium text-ink">
                    {isToday ? "添加今日饮食" : `添加 ${shortDateLabel(selectedDate)} 饮食`}
                  </p>
                  <Dropdown
                    label="餐次 / Meal"
                    value={dietMeal}
                    onChange={(v) => setDietMeal(v as MealType)}
                    options={mealOptions}
                  />
                  <Input
                    value={dietFood}
                    onChange={(e) => setDietFood(e.target.value)}
                    label="食物 / Food"
                    placeholder="例如 鸡胸肉 150g"
                  />
                  <Input
                    type="number"
                    value={dietCal}
                    onChange={(e) => setDietCal(e.target.value)}
                    label="热量 (kcal，可选)"
                    placeholder="例如 200"
                  />
                  <Button onClick={handleAddDiet}>+ 记录饮食</Button>
                </Card>
                <Card className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-ink">{dayLabel("概览")}</p>
                  <p className="text-3xl font-semibold text-ink">{dietCalories} kcal</p>
                  <p className="text-xs text-muted">{dayLabel("已记录")} {dayDiet.length} 项</p>
                  <div className="border-t border-line pt-3">
                    <p className="mb-2 text-xs font-medium text-muted">各餐热量分布</p>
                    {dietMealBar.every((d) => d.value === 0) ? (
                      <p className="text-xs text-muted">暂无数据</p>
                    ) : (
                      <BarTrend data={dietMealBar} label="热量(kcal)" />
                    )}
                  </div>
                </Card>
              </div>
              <Card>
                <p className="mb-3 text-sm font-medium text-ink">{dayLabel("饮食明细")}</p>
                {dayDiet.length === 0 ? (
                  <p className="text-xs text-muted">还没有记录，左侧添加第一笔吧 🍱</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {(["breakfast", "lunch", "dinner", "snack"] as MealType[]).map((m) =>
                      dietByMeal[m].length === 0 ? null : (
                        <div key={m}>
                          <p className="mb-1 text-xs font-semibold text-muted">{mealLabel[m]}</p>
                          <ul className="flex flex-col divide-y divide-line">
                            {dietByMeal[m].map((d) => (
                              <li
                                key={d.id}
                                className="flex items-center justify-between py-2 text-sm"
                              >
                                <span className="text-ink">
                                  {d.food}
                                  {d.calories != null && (
                                    <span className="text-muted"> · {d.calories} kcal</span>
                                  )}
                                </span>
                                <button
                                  onClick={async () => {
                                    try {
                                      await store.health.deleteDietEntry(uid, d.id);
                                      await loadAll();
                                    } catch (err) {
                                      show(err instanceof Error ? err.message : "删除失败", "warning");
                                    }
                                  }}
                                  className="inline-flex items-center rounded-lg border border-red-500/15 px-2.5 py-1 text-xs text-red-400 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
                                >
                                  删除
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    )}
                  </div>
                )}
              </Card>
            </div>
          )}

          {tab === "workout" && (
            <div className="flex flex-col gap-6">
              {/* 未来 7 天规划总览 */}
              <Card className="border-l-4 border-l-brand">
                <p className="mb-3 text-sm font-medium text-ink">未来 7 天规划</p>
                {!hasFuturePlan ? (
                  <p className="text-xs text-muted">
                    未来 7 天暂无计划，左侧添加健身 / 饮食即可前瞻安排 🗓️
                  </p>
                ) : (
                  <ul className="flex flex-col divide-y divide-line">
                    {future7.map((d) => {
                      const wMin = d.workouts.reduce((s, w) => s + w.durationMin, 0);
                      const noPlan = d.workouts.length === 0 && d.diet.length === 0;
                      return (
                        <li
                          key={d.key}
                          className="flex items-center justify-between py-2 text-sm"
                        >
                          <span className="text-ink">{shortDateLabel(d.key)}</span>
                          <span className="text-xs text-muted">
                            {noPlan
                              ? "—"
                              : `计划运动 ${d.workouts.length} 项(${wMin} 分钟) · 饮食 ${d.diet.length} 笔`}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Card className="flex flex-col gap-3">
                  <p className="text-sm font-medium text-ink">
                    {isToday ? "添加今日健身" : `添加 ${shortDateLabel(selectedDate)} 健身`}
                  </p>
                  <Input
                    value={workoutName}
                    onChange={(e) => setWorkoutName(e.target.value)}
                    label="运动项目 / Activity"
                    placeholder="游泳 / 篮球 / 撸铁…"
                  />
                  <Input
                    type="number"
                    value={workoutMin}
                    onChange={(e) => setWorkoutMin(e.target.value)}
                    label="计划时长 (分钟)"
                    placeholder="例如 60"
                  />
                  <Button onClick={handleAddWorkout}>+ 添加</Button>
                </Card>
                <Card className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-ink">{dayLabel("完成度")}</p>
                  <p className="text-3xl font-semibold text-ink">
                    {workoutDone}/{dayWorkout.length}
                  </p>
                  <p className="text-xs text-muted">{dayLabel("已运动")} {workoutMinToday} 分钟</p>
                  <div className="border-t border-line pt-3">
                    <p className="mb-2 text-xs font-medium text-muted">近 7 天运动时长(分钟)</p>
                    <p className="mb-2 text-xs text-muted">（截至今天）</p>
                    <BarTrend data={workout7} label="时长(min)" />
                  </div>
                </Card>
              </div>
              <Card>
                <p className="mb-3 text-sm font-medium text-ink">{dayLabel("健身清单")}</p>
                {dayWorkout.length === 0 ? (
                  <p className="text-xs text-muted">还没有计划，左侧添加一项吧 🏋️</p>
                ) : (
                  <ul className="flex flex-col divide-y divide-line">
                    {dayWorkout.map((w) => (
                      <li key={w.id} className="flex items-center gap-3 py-2 text-sm">
                        <input
                          type="checkbox"
                          checked={w.done}
                          onChange={async () => {
                            try {
                              await store.health.updateWorkoutEntry(uid, w.id, { done: !w.done });
                              await loadAll();
                            } catch (err) {
                              show(err instanceof Error ? err.message : "更新失败", "warning");
                            }
                          }}
                          className="h-4 w-4 accent-brand"
                        />
                        <span className={`flex-1 ${w.done ? "text-muted line-through" : "text-ink"}`}>
                          {w.activity}
                        </span>
                        <span className="text-xs text-muted">{w.durationMin} min</span>
                        <button
                          onClick={async () => {
                            try {
                              await store.health.deleteWorkoutEntry(uid, w.id);
                              await loadAll();
                            } catch (err) {
                              show(err instanceof Error ? err.message : "删除失败", "warning");
                            }
                          }}
                          className="inline-flex items-center rounded-lg border border-red-500/15 px-2.5 py-1 text-xs text-red-400 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
                        >
                          删除
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          )}

          {tab === "sleep" && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Card className="flex flex-col gap-3">
                  <p className="text-sm font-medium text-ink">
                    {isToday ? "记录今日睡眠" : `记录 ${shortDateLabel(selectedDate)} 睡眠`}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="time"
                      value={bedtime}
                      onChange={(e) => setBedtime(e.target.value)}
                      label="入睡时间"
                    />
                    <Input
                      type="time"
                      value={wakeTime}
                      onChange={(e) => setWakeTime(e.target.value)}
                      label="起床时间"
                    />
                  </div>
                  <Dropdown
                    label="睡眠质量 / Quality"
                    value={sleepQuality}
                    onChange={(v) => setSleepQuality(v as SleepQuality)}
                    options={[
                      { value: "good", label: "好 / Good" },
                      { value: "fair", label: "中 / Fair" },
                      { value: "poor", label: "差 / Poor" },
                    ]}
                  />
                  <Input
                    value={sleepNote}
                    onChange={(e) => setSleepNote(e.target.value)}
                    label="备注 (可选)"
                    placeholder="例如 半夜醒了一次"
                  />
                  <Button onClick={handleAddSleep}>+ 记录睡眠</Button>
                  <div className="border-t border-line pt-3 text-xs text-muted">
                    时长按入睡/起床时间自动计算（支持跨午夜）。
                  </div>
                </Card>
                <Card className="flex flex-col gap-2 justify-center">
                  <p className="text-sm font-medium text-ink">{dayLabel("睡眠概览")}</p>
                  {daySleep.length === 0 ? (
                    <p className="text-xs text-muted">还没有记录</p>
                  ) : (
                    daySleep.map((s) => (
                      <div key={s.id} className="rounded-lg border border-line p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-ink">
                            {fmtDuration(s.durationMin)}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs ${qualityBadge[s.quality]}`}
                          >
                            {qualityLabel[s.quality]}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted">
                          入睡 {s.bedtime} · 起床 {s.wakeTime}
                        </p>
                        {s.note && <p className="text-xs text-muted">备注：{s.note}</p>}
                      </div>
                    ))
                  )}
                </Card>
              </div>
              <Card>
                <p className="mb-1 text-sm font-medium text-ink">近 7 天睡眠时长 (小时)</p>
                <p className="mb-2 text-xs text-muted">（截至今天）</p>
                {sleepList.length === 0 ? (
                  <p className="py-12 text-center text-xs text-muted">暂无数据</p>
                ) : (
                  <BarTrend data={sleep7} label="睡眠(小时)" />
                )}
              </Card>
              <Card>
                <p className="mb-3 text-sm font-medium text-ink">{dayLabel("睡眠记录")}</p>
                {sleepList.length === 0 ? (
                  <p className="text-xs text-muted">暂无记录</p>
                ) : (
                  <ul className="flex flex-col divide-y divide-line">
                    {[...sleepList].reverse().map((s) => (
                      <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                        <span className="text-ink">
                          {format(new Date(s.date + "T00:00:00"), "yyyy/MM/dd")} ·{" "}
                          {fmtDuration(s.durationMin)}
                          <span className="text-muted"> · 质量 {qualityLabel[s.quality]}</span>
                        </span>
                        <button
                          onClick={async () => {
                            try {
                              await store.health.deleteSleepEntry(uid, s.id);
                              await loadAll();
                            } catch (err) {
                              show(err instanceof Error ? err.message : "删除失败", "warning");
                            }
                          }}
                          className="inline-flex items-center rounded-lg border border-red-500/15 px-2.5 py-1 text-xs text-red-400 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
                        >
                          删除
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          )}

          {tab === "weekly" && (
            <div className="flex flex-col gap-6">
              <p className="text-sm text-muted">
                {shortDateLabel(days7[0])} – {shortDateLabel(days7[days7.length - 1])} · 过去{" "}
                {weekly.days} 天概览
              </p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                <Card className="p-4">
                  <p className="text-xs text-muted">日均饮水</p>
                  <p className="mt-1 text-xl font-semibold text-ink">{weekly.waterAvg} ml</p>
                  <p className="text-xs text-muted">目标 {weekly.target} ml</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-muted">最新体重</p>
                  <p className="mt-1 text-xl font-semibold text-ink">
                    {weekly.latestWeight != null ? `${weekly.latestWeight} kg` : "—"}
                  </p>
                  <p className="text-xs text-muted">
                    {weekly.weightChange != null
                      ? `本周 ${weekly.weightChange > 0 ? "+" : ""}${weekly.weightChange} kg`
                      : "趋势未知"}
                  </p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-muted">日均热量</p>
                  <p className="mt-1 text-xl font-semibold text-ink">{weekly.dietAvg} kcal</p>
                  <p className="text-xs text-muted">饮食记录汇总</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-muted">平均睡眠</p>
                  <p className="mt-1 text-xl font-semibold text-ink">{weekly.avgSleepH} 小时</p>
                  <p className="text-xs text-muted">质量{weekly.qualityLabelAvg}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-xs text-muted">运动</p>
                  <p className="mt-1 text-xl font-semibold text-ink">{weekly.trainedDays} 天</p>
                  <p className="text-xs text-muted">累计 {weekly.totalWorkoutMin} 分钟</p>
                </Card>
              </div>

              <Card>
                <p className="mb-3 text-sm font-medium text-ink">一周数据分析报告</p>
                <ul className="flex flex-col gap-2">
                  {weekly.report.map((r, i) => (
                    <li key={i} className="text-sm text-ink">
                      {r}
                    </li>
                  ))}
                </ul>
              </Card>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Card>
                  <p className="mb-2 text-sm font-medium text-ink">饮水 (ml)</p>
                  {weekly.waterChart.some((d) => d.value > 0) ? (
                    <BarTrend data={weekly.waterChart} label="饮水(ml)" />
                  ) : (
                    <p className="py-8 text-center text-xs text-muted">暂无数据</p>
                  )}
                </Card>
                <Card>
                  <p className="mb-2 text-sm font-medium text-ink">体重 (kg)</p>
                  {weekly.weightChart.some((d) => d.value != null) ? (
                    <LineTrend data={weekly.weightChart} label="体重(kg)" connectNulls />
                  ) : (
                    <p className="py-8 text-center text-xs text-muted">暂无数据</p>
                  )}
                </Card>
                <Card>
                  <p className="mb-2 text-sm font-medium text-ink">饮食热量 (kcal)</p>
                  {weekly.dietChart.some((d) => d.value > 0) ? (
                    <BarTrend data={weekly.dietChart} label="热量(kcal)" />
                  ) : (
                    <p className="py-8 text-center text-xs text-muted">暂无数据</p>
                  )}
                </Card>
                <Card>
                  <p className="mb-2 text-sm font-medium text-ink">睡眠 (小时)</p>
                  {weekly.sleepChart.some((d) => d.value > 0) ? (
                    <BarTrend data={weekly.sleepChart} label="睡眠(小时)" />
                  ) : (
                    <p className="py-8 text-center text-xs text-muted">暂无数据</p>
                  )}
                </Card>
                <Card className="sm:col-span-2">
                  <p className="mb-2 text-sm font-medium text-ink">运动时长 (分钟)</p>
                  {weekly.workoutChart.some((d) => d.value > 0) ? (
                    <BarTrend data={weekly.workoutChart} label="时长(min)" />
                  ) : (
                    <p className="py-8 text-center text-xs text-muted">暂无数据</p>
                  )}
                </Card>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
