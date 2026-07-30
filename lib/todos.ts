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
