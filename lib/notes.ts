// 个人知识库：类型定义 + localStorage 实现（LocalStore 复用）
import { readJSON, writeJSON, genId } from "./storage";

export interface Notebook {
  id: string;
  userId: string;
  name: string;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
  noteCount: number;
}

export interface NoteSummary {
  id: string;
  userId: string;
  notebookId: string | null;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface Note extends NoteSummary {
  content: string;
}

const notebooksKey = (userId: string) => `aiwf_notebooks_${userId}`;
const notesKey = (userId: string) => `aiwf_notes_${userId}`;

// ---------- Notebooks ----------
export function getNotebooks(userId: string): Notebook[] {
  return readJSON<Notebook[]>(notebooksKey(userId), []).sort(
    (a, b) => a.sortOrder - b.sortOrder || a.createdAt - b.createdAt
  );
}

export function addNotebook(userId: string, name: string): Notebook {
  const list = getNotebooks(userId);
  const nb: Notebook = {
    id: genId(),
    userId,
    name,
    sortOrder: list.length,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    noteCount: 0,
  };
  list.push(nb);
  writeJSON(notebooksKey(userId), list);
  return nb;
}

export function updateNotebook(userId: string, id: string, name: string) {
  const list = getNotebooks(userId);
  const idx = list.findIndex((n) => n.id === id);
  if (idx === -1) return;
  list[idx] = { ...list[idx], name, updatedAt: Date.now() };
  writeJSON(notebooksKey(userId), list);
}

export function deleteNotebook(userId: string, id: string) {
  const list = getNotebooks(userId).filter((n) => n.id !== id);
  writeJSON(notebooksKey(userId), list);
  // 其下文档变为未分类
  const notes = getNotes(userId).map((n) =>
    n.notebookId === id ? { ...n, notebookId: null } : n
  );
  writeJSON(notesKey(userId), notes);
}

// ---------- Notes ----------
export function getNotes(userId: string, notebookId?: string | null): NoteSummary[] {
  let list = readJSON<Note[]>(notesKey(userId), []);
  if (notebookId !== undefined) {
    list = list.filter((n) => n.notebookId === notebookId);
  }
  return list
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map(({ content: _c, ...rest }) => rest);
}

export function getNote(userId: string, id: string): Note | null {
  const list = readJSON<Note[]>(notesKey(userId), []);
  return list.find((n) => n.id === id) ?? null;
}

export function addNote(
  userId: string,
  data: { title: string; content?: string; notebookId?: string | null }
): Note {
  const list = readJSON<Note[]>(notesKey(userId), []);
  const now = Date.now();
  const note: Note = {
    id: genId(),
    userId,
    notebookId: data.notebookId ?? null,
    title: data.title,
    content: data.content ?? "",
    createdAt: now,
    updatedAt: now,
  };
  list.push(note);
  writeJSON(notesKey(userId), list);
  return note;
}

export function updateNote(
  userId: string,
  id: string,
  patch: Partial<Pick<Note, "title" | "content" | "notebookId">>
) {
  const list = readJSON<Note[]>(notesKey(userId), []);
  const idx = list.findIndex((n) => n.id === id);
  if (idx === -1) return;
  list[idx] = { ...list[idx], ...patch, updatedAt: Date.now() };
  writeJSON(notesKey(userId), list);
}

export function deleteNote(userId: string, id: string) {
  const list = readJSON<Note[]>(notesKey(userId), []).filter((n) => n.id !== id);
  writeJSON(notesKey(userId), list);
}
