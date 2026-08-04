import { readJSON, writeJSON, genId } from "./storage";

export type TodoPriority = "low" | "medium" | "high";
export type TodoStatus = "pending" | "completed";

export interface Todo {
  id: string;
  userId: string;
  title: string;
  description?: string;
  due: number | null; // 截止时间戳(ms)，null 表示无截止时间
  priority: TodoPriority;
  status: TodoStatus;
  createdAt: number;
  completedAt?: number | null;
}

const todosKey = (userId: string) => `aiwf_todos_${userId}`;

export function getTodos(userId: string): Todo[] {
  return readJSON<Todo[]>(todosKey(userId), []).sort(
    (a, b) => b.createdAt - a.createdAt
  );
}

export function saveTodos(userId: string, list: Todo[]) {
  writeJSON(todosKey(userId), list);
}

export function addTodo(
  userId: string,
  data: Omit<Todo, "id" | "userId" | "createdAt" | "status" | "completedAt">
): Todo {
  const list = getTodos(userId);
  const todo: Todo = {
    ...data,
    id: genId(),
    userId,
    status: "pending",
    completedAt: null,
    createdAt: Date.now(),
  };
  list.push(todo);
  saveTodos(userId, list);
  return todo;
}

export function updateTodo(userId: string, id: string, patch: Partial<Todo>) {
  const list = getTodos(userId);
  const idx = list.findIndex((t) => t.id === id);
  if (idx === -1) return;
  list[idx] = { ...list[idx], ...patch };
  saveTodos(userId, list);
}

export function deleteTodo(userId: string, id: string) {
  const list = getTodos(userId).filter((t) => t.id !== id);
  saveTodos(userId, list);
}

export function toggleTodo(userId: string, id: string) {
  const todo = getTodos(userId).find((t) => t.id === id);
  if (!todo) return;
  const completed = todo.status === "completed";
  updateTodo(userId, id, {
    status: completed ? "pending" : "completed",
    completedAt: completed ? null : Date.now(),
  });
}

// ===== 完成评价：根据确认完成时间与截止时间自动判断 =====
export type TodoEvaluationTone = "positive" | "neutral" | "danger";

export interface TodoEvaluation {
  kind: "early" | "kadian" | "redeemed" | "overdue";
  label: string;
  emoji: string;
  tone: TodoEvaluationTone;
}

/** 卡点阈值：截止前 1 小时内完成视为「卡点完成」 */
export const KADIAN_MS = 60 * 60 * 1000;

export function evaluateTodo(todo: Todo, now: number = Date.now()): TodoEvaluation | null {
  if (!todo.due) return null; // 无截止时间不评价
  if (todo.status === "pending") {
    return todo.due < now
      ? { kind: "overdue", label: "逾期未完成", emoji: "😔", tone: "danger" }
      : null;
  }
  if (todo.completedAt == null) return null; // 历史数据无完成时间，不评价
  if (todo.completedAt <= todo.due - KADIAN_MS) {
    return { kind: "early", label: "提前完成", emoji: "😊", tone: "positive" };
  }
  if (todo.completedAt <= todo.due) {
    return { kind: "kadian", label: "卡点完成", emoji: "😢", tone: "neutral" };
  }
  return { kind: "redeemed", label: "补救成功", emoji: "😊", tone: "positive" };
}