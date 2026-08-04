"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { getStore } from "@/lib/store";
import type { Notebook, Note, NoteSummary } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { MarkdownView } from "@/components/ui/MarkdownView";
import { MarkdownToolbar } from "@/components/ui/MarkdownToolbar";
import { applyMarkdownAction, type MarkdownAction } from "@/lib/markdown";

const store = getStore();

type Filter = "all" | "none" | string; // string = notebookId
type Mode = "edit" | "preview" | "split";

function fmtTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function NotesPage() {
  const { user } = useAuth();
  const { show } = useToast();

  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loaded, setLoaded] = useState(false);

  // 当前编辑的文档
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<Mode>("edit");
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const handleToolbarAction = (action: MarkdownAction) => {
    const el = editorRef.current;
    if (!el) return;
    const res = applyMarkdownAction(action, content, el.selectionStart, el.selectionEnd);
    setContent(res.value);
    setDirty(true);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(res.selStart, res.selEnd);
    });
  };

  // 新建/重命名知识库
  const [nbModalOpen, setNbModalOpen] = useState(false);
  const [nbName, setNbName] = useState("");
  const [nbEditing, setNbEditing] = useState<Notebook | null>(null);

  const loadNotebooks = useCallback(async () => {
    if (!user) return;
    try {
      setNotebooks(await store.notes.getNotebooks(user.id));
    } catch (e) {
      console.error("加载知识库失败", e);
    }
  }, [user]);

  const loadNotes = useCallback(
    async (f: Filter) => {
      if (!user) return;
      try {
        const nbId = f === "all" ? undefined : f === "none" ? null : f;
        setNotes(await store.notes.getNotes(user.id, nbId));
      } catch (e) {
        console.error("加载文档列表失败", e);
      }
    },
    [user]
  );

  useEffect(() => {
    if (!user) return;
    (async () => {
      await Promise.all([loadNotebooks(), loadNotes(filter)]);
      setLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const selectFilter = (f: Filter) => {
    setFilter(f);
    setNote(null);
    setTitle("");
    setContent("");
    setDirty(false);
    loadNotes(f);
  };

  const openNote = async (id: string) => {
    if (!user) return;
    try {
      const n = await store.notes.getNote(user.id, id);
      if (!n) return;
      setNote(n);
      setTitle(n.title);
      setContent(n.content);
      setDirty(false);
      setMode("edit");
    } catch (e) {
      show(e instanceof Error ? e.message : "加载文档失败", "warning");
    }
  };

  const saveNote = async () => {
    if (!user || !note) return;
    if (!title.trim()) {
      show("请填写文档标题", "warning");
      return;
    }
    setSaving(true);
    try {
      await store.notes.updateNote(user.id, note.id, {
        title: title.trim(),
        content,
      });
      setNote({ ...note, title: title.trim(), content, updatedAt: Date.now() });
      setDirty(false);
      show("已保存 ✅", "success");
      loadNotes(filter);
      loadNotebooks();
    } catch (e) {
      show(e instanceof Error ? e.message : "保存失败", "warning");
    } finally {
      setSaving(false);
    }
  };

  const createNote = async () => {
    if (!user) return;
    const nbId = filter === "none" ? null : filter === "all" ? null : filter;
    try {
      const n = await store.notes.addNote(user.id, {
        title: "未命名文档",
        content: "# 新文档\n\n开始记录…",
        notebookId: nbId,
      });
      show("已新建文档 📝", "success");
      loadNotes(filter);
      loadNotebooks();
      openNote(n.id);
    } catch (e) {
      show(e instanceof Error ? e.message : "新建失败", "warning");
    }
  };

  const deleteNote = async (n: NoteSummary) => {
    if (!user) return;
    if (!confirm(`确认删除「${n.title}」？此操作不可恢复。`)) return;
    try {
      await store.notes.removeNote(user.id, n.id);
      if (note?.id === n.id) {
        setNote(null);
        setTitle("");
        setContent("");
        setDirty(false);
      }
      show("已删除 🗑️", "success");
      loadNotes(filter);
      loadNotebooks();
    } catch (e) {
      show(e instanceof Error ? e.message : "删除失败", "warning");
    }
  };

  const moveNote = async (nbId: string) => {
    if (!user || !note) return;
    try {
      await store.notes.updateNote(user.id, note.id, { notebookId: nbId || null });
      setNote({ ...note, notebookId: nbId || null });
      show("已移动 📦", "success");
      loadNotes(filter);
      loadNotebooks();
    } catch (e) {
      show(e instanceof Error ? e.message : "移动失败", "warning");
    }
  };

  // 知识库 CRUD
  const openNbModal = (nb: Notebook | null) => {
    setNbEditing(nb);
    setNbName(nb?.name ?? "");
    setNbModalOpen(true);
  };

  const saveNotebook = async () => {
    if (!user) return;
    const name = nbName.trim();
    if (!name) {
      show("请填写知识库名称", "warning");
      return;
    }
    try {
      if (nbEditing) {
        await store.notes.updateNotebook(user.id, nbEditing.id, name);
        show("已重命名 ✅", "success");
      } else {
        await store.notes.addNotebook(user.id, name);
        show("已创建知识库 ✅", "success");
      }
      setNbModalOpen(false);
      await loadNotebooks();
    } catch (e) {
      show(e instanceof Error ? e.message : "保存失败", "warning");
    }
  };

  const deleteNotebook = async (nb: Notebook) => {
    if (!user) return;
    if (!confirm(`删除知识库「${nb.name}」？其下 ${nb.noteCount} 篇文档将变为「未分类」。`)) return;
    try {
      await store.notes.removeNotebook(user.id, nb.id);
      if (filter === nb.id) selectFilter("all");
      show("已删除知识库 🗑️", "success");
      await loadNotebooks();
      await loadNotes(filter);
    } catch (e) {
      show(e instanceof Error ? e.message : "删除失败", "warning");
    }
  };

  const filterLabel = useMemo(() => {
    if (filter === "all") return "全部文档";
    if (filter === "none") return "未分类";
    return notebooks.find((n) => n.id === filter)?.name ?? "知识库";
  }, [filter, notebooks]);

  if (!user) return null;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:flex-row">
      {/* 左栏：知识库列表 */}
      <div className="flex w-full flex-col gap-2 lg:w-52 lg:shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-ink">知识库</h1>
          <Button variant="secondary" onClick={() => openNbModal(null)}>
            + 新建
          </Button>
        </div>
        <button
          onClick={() => selectFilter("all")}
          className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
            filter === "all" ? "bg-gray-100 font-medium text-ink" : "text-muted hover:bg-gray-50 hover:text-ink"
          }`}
        >
          📄 全部文档
        </button>
        <button
          onClick={() => selectFilter("none")}
          className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
            filter === "none" ? "bg-gray-100 font-medium text-ink" : "text-muted hover:bg-gray-50 hover:text-ink"
          }`}
        >
          📥 未分类
        </button>
        <div className="my-1 border-t border-line" />
        {notebooks.map((nb) => (
          <div
            key={nb.id}
            className={`group flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
              filter === nb.id ? "bg-gray-100 font-medium text-ink" : "text-muted hover:bg-gray-50 hover:text-ink"
            }`}
          >
            <button className="min-w-0 flex-1 text-left" onClick={() => selectFilter(nb.id)}>
              <span className="truncate">📚 {nb.name}</span>
              <span className="ml-1 text-xs text-muted">{nb.noteCount}</span>
            </button>
            <div className="hidden shrink-0 gap-1 group-hover:flex">
              <button className="text-xs text-muted hover:text-ink" onClick={() => openNbModal(nb)}>
                改
              </button>
              <button className="text-xs text-red-500 hover:text-red-600" onClick={() => deleteNotebook(nb)}>
                删
              </button>
            </div>
          </div>
        ))}
        {!loaded ? <p className="px-3 py-4 text-xs text-muted">加载中…</p> : null}
      </div>

      {/* 中栏：文档列表 */}
      <div className="flex w-full flex-col gap-2 lg:w-64 lg:shrink-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-ink">{filterLabel}</p>
          <Button variant="secondary" onClick={createNote}>
            + 新建文档
          </Button>
        </div>
        {!loaded ? (
          <p className="py-8 text-center text-xs text-muted">加载中…</p>
        ) : notes.length === 0 ? (
          <Card className="py-10 text-center text-xs text-muted">
            这里还没有文档，点击「新建文档」开始记录 ✍️
          </Card>
        ) : (
          <div className="flex flex-col gap-1.5">
            {notes.map((n) => (
              <div
                key={n.id}
                className={`group rounded-lg border px-3 py-2 transition-colors ${
                  note?.id === n.id ? "border-brand bg-brand/5" : "border-transparent hover:border-line hover:bg-white"
                }`}
              >
                <button className="block w-full text-left" onClick={() => openNote(n.id)}>
                  <span className="block truncate text-sm font-medium text-ink">{n.title}</span>
                  <span className="text-xs text-muted">更新于 {fmtTime(n.updatedAt)}</span>
                </button>
                <div className="hidden justify-end gap-2 group-hover:flex">
                  <button className="text-xs text-red-500 hover:underline" onClick={() => deleteNote(n)}>
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 右栏：编辑器 / 预览 */}
      <div className="min-w-0 flex-1">
        {!note ? (
          <Card className="flex h-64 items-center justify-center text-sm text-muted">
            从左侧选择或新建一篇文档开始编辑 📝
          </Card>
        ) : (
          <Card className="flex flex-col gap-3 p-0">
            {/* 工具栏 */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
              <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-0.5">
                {(["edit", "split", "preview"] as Mode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                      mode === m ? "bg-white font-medium text-ink shadow-sm" : "text-muted hover:text-ink"
                    }`}
                  >
                    {m === "edit" ? "编辑" : m === "split" ? "分屏" : "预览"}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={note.notebookId ?? ""}
                  onChange={(e) => moveNote(e.target.value)}
                  className="rounded-lg border border-line bg-white px-2 py-1 text-xs text-muted outline-none focus:border-ink"
                >
                  <option value="">未分类</option>
                  {notebooks.map((nb) => (
                    <option key={nb.id} value={nb.id}>
                      {nb.name}
                    </option>
                  ))}
                </select>
                {dirty && <span className="text-xs text-amber-500">未保存</span>}
                <Button
                  onClick={saveNote}
                  disabled={saving || !dirty}
                  className="px-3 py-1 text-xs"
                >
                  {saving ? "保存中…" : "保存"}
                </Button>
              </div>
            </div>

            <div className="px-4 pt-2">
              <input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setDirty(true);
                }}
                placeholder="文档标题"
                className="w-full bg-transparent text-xl font-semibold text-ink outline-none placeholder:text-muted/50"
              />
            </div>

            {mode !== "preview" && <MarkdownToolbar onAction={handleToolbarAction} />}

            <div className={`grid ${mode === "split" ? "grid-cols-2" : "grid-cols-1"} min-h-[420px]`}>
              {mode !== "preview" && (
                <textarea
                  ref={editorRef}
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    setDirty(true);
                  }}
                  placeholder={"支持 Markdown：标题、列表、表格、代码块、任务清单…\n\n用 Ctrl/Cmd + S 快速保存"}
                  className={`h-[420px] w-full resize-none bg-transparent px-4 pb-4 font-mono text-sm leading-6 text-ink outline-none placeholder:text-muted/50 ${
                    mode === "split" ? "border-r border-line" : ""
                  }`}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
                      e.preventDefault();
                      saveNote();
                    }
                  }}
                />
              )}
              {mode !== "edit" && (
                <div className="max-h-[420px] overflow-y-auto px-4 pb-4">
                  <MarkdownView content={content} />
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* 新建/重命名知识库弹窗 */}
      {nbModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setNbModalOpen(false)}>
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-ink">{nbEditing ? "重命名知识库" : "新建知识库"}</h3>
            <div className="mt-4">
              <Input
                label="名称"
                value={nbName}
                onChange={(e) => setNbName(e.target.value)}
                placeholder="例如：工作笔记 / 学习资料"
                autoFocus
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setNbModalOpen(false)}>
                取消
              </Button>
              <Button onClick={saveNotebook}>保存</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
