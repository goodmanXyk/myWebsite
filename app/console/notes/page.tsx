"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { getStore } from "@/lib/store";
import type { Notebook, Note, NoteSummary } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dropdown } from "@/components/ui/Dropdown";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { Card } from "@/components/ui/Card";
import { MarkdownView } from "@/components/ui/MarkdownView";
import { RichTextEditor } from "@/components/console/RichTextEditor";

const store = getStore();

type Filter = "all" | "none" | string; // string = notebookId

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

  // 当前打开的文档
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editing, setEditing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [collapse, setCollapse] = useState<{ left: boolean; middle: boolean }>({
    left: false,
    middle: false,
  });

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("aiwf_notes_collapse");
      if (raw) setCollapse(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const toggleCollapse = (key: "left" | "middle") => {
    setCollapse((c) => {
      const next = { ...c, [key]: !c[key] };
      try {
        window.localStorage.setItem("aiwf_notes_collapse", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // 右键菜单
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; notebook: Notebook } | null>(null);

  // 本地文件导入
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setEditing(false);
    loadNotes(f);
  };

  const openNote = async (id: string, edit = false) => {
    if (!user) return;
    try {
      const n = await store.notes.getNote(user.id, id);
      if (!n) return;
      setNote(n);
      setTitle(n.title);
      setContent(n.content);
      setDirty(false);
      setEditing(edit);
    } catch (e) {
      show(e instanceof Error ? e.message : "加载文档失败", "warning");
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s" && note && editing) {
        e.preventDefault();
        saveNote();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note, editing, dirty, title]);

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

  const handleImport = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImporting(true);
    try {
      const nbId = filter === "none" ? null : filter === "all" ? null : filter;
      const n = await store.notes.importNote(user.id, { file, notebookId: nbId });
      show(`已导入「${n.title}」📥`, "success");
      await loadNotes(filter);
      await loadNotebooks();
      await openNote(n.id);
    } catch (err) {
      show(err instanceof Error ? err.message : "导入失败", "warning");
    } finally {
      setImporting(false);
    }
  };

  const createNote = async () => {
    if (!user) return;
    const nbId = filter === "none" ? null : filter === "all" ? null : filter;
    try {
      const n = await store.notes.addNote(user.id, {
        title: "未命名文档",
        content: "",
        notebookId: nbId,
      });
      show("已新建文档 📝", "success");
      loadNotes(filter);
      loadNotebooks();
      openNote(n.id, true);
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
        setEditing(false);
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
    <div className="mx-auto flex w-full flex-col gap-4 lg:flex-row">
      {/* 左栏：知识库列表（可折叠） */}
      {!collapse.left && (
      <div className="flex w-full flex-col gap-2 lg:w-48 lg:shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-ink">知识库</h1>
          <div className="flex items-center gap-1">
            <Button variant="secondary" onClick={() => openNbModal(null)}>
              + 新建
            </Button>
            <button
              onClick={() => toggleCollapse("left")}
              title="收起知识库面板"
              className="hidden h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-white/10 hover:text-ink lg:flex"
            >
              ‹
            </button>
          </div>
        </div>
        <button
          onClick={() => selectFilter("all")}
          className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
            filter === "all" ? "bg-white/10 font-medium text-ink" : "text-muted hover:bg-white/[0.04] hover:text-ink"
          }`}
        >
          📄 全部文档
        </button>
        <button
          onClick={() => selectFilter("none")}
          className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
            filter === "none" ? "bg-white/10 font-medium text-ink" : "text-muted hover:bg-white/[0.04] hover:text-ink"
          }`}
        >
          📥 未分类
        </button>
        <div className="my-1 border-t border-line" />
        {notebooks.map((nb) => (
          <div
            key={nb.id}
            className={`group flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
              filter === nb.id ? "bg-white/10 font-medium text-ink" : "text-muted hover:bg-white/[0.04] hover:text-ink"
            }`}
            onContextMenu={(e) => {
              e.preventDefault();
              setCtxMenu({ x: e.clientX, y: e.clientY, notebook: nb });
            }}
            title="右键：重命名 / 删除"
          >
            <button className="min-w-0 flex-1 text-left" onClick={() => selectFilter(nb.id)}>
              <span className="truncate">📚 {nb.name}</span>
              <span className="ml-1 text-xs text-muted">{nb.noteCount}</span>
            </button>
          </div>
        ))}
        {!loaded ? <p className="px-3 py-4 text-xs text-muted">加载中…</p> : null}
      </div>
      )}
      {collapse.left && (
        <div className="hidden w-9 shrink-0 flex-col items-center border-r border-line py-3 lg:flex">
          <button
            onClick={() => toggleCollapse("left")}
            title="展开知识库面板"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-white/10 hover:text-ink"
          >
            »
          </button>
        </div>
      )}

      {/* 中栏：文档列表（可折叠） */}
      {!collapse.middle && (
      <div className="flex w-full flex-col gap-2 lg:w-64 lg:shrink-0">
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-sm font-medium text-ink">{filterLabel}</p>
          <button
            onClick={() => toggleCollapse("middle")}
            title="收起文档列表"
            className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-white/10 hover:text-ink lg:flex"
          >
            ‹
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex-1 px-3 py-1.5 text-xs"
          >
            {importing ? "导入中…" : "导入"}
          </Button>
          <Button
            variant="secondary"
            onClick={createNote}
            className="flex-1 px-3 py-1.5 text-xs"
          >
            + 新建文档
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown,.txt,.doc,.docx,.xls,.xlsx,.csv,.pdf"
            className="hidden"
            onChange={handleImport}
          />
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
                  note?.id === n.id ? "border-brand bg-brand/5" : "border-transparent hover:border-line hover:bg-surface"
                }`}
              >
                <button className="block w-full text-left" onClick={() => openNote(n.id)}>
                  <span className="block truncate text-sm font-medium text-ink">{n.title}</span>
                  <span className="text-xs text-muted">更新于 {fmtTime(n.updatedAt)}</span>
                </button>
                <div className="hidden justify-end gap-2 group-hover:flex">
                  <button
                    onClick={() => openNote(n.id, true)}
                    className="inline-flex items-center rounded-lg px-2.5 py-1 text-xs text-muted transition-colors hover:bg-white/5 hover:text-white"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => deleteNote(n)}
                    className="inline-flex items-center rounded-lg px-2.5 py-1 text-xs text-muted transition-colors hover:bg-white/5 hover:text-red-300"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}
      {collapse.middle && (
        <div className="hidden w-9 shrink-0 flex-col items-center border-r border-line py-3 lg:flex">
          <button
            onClick={() => toggleCollapse("middle")}
            title="展开文档列表"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-white/10 hover:text-ink"
          >
            »
          </button>
        </div>
      )}

      {/* 右栏：预览 / 编辑 */}
      <div className="min-w-0 flex-1">
        {!note ? (
          <Card className="flex h-64 items-center justify-center text-sm text-muted">
            从左侧选择一篇文档查看，或新建一篇开始记录 📝
          </Card>
        ) : editing ? (
          /* ---------- 编辑模式 ---------- */
          <Card className="flex h-[calc(100dvh-8rem)] min-h-[420px] flex-col p-0">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-ink">编辑文档</span>
                {dirty && <span className="text-xs text-amber-500">未保存</span>}
              </div>
              <div className="flex items-center gap-2">
                <Dropdown
                  value={note.notebookId ?? ""}
                  onChange={moveNote}
                  options={[
                    { value: "", label: "未分类" },
                    ...notebooks.map((nb) => ({ value: nb.id, label: nb.name })),
                  ]}
                  className="w-36"
                />
                <Button variant="secondary" onClick={() => setEditing(false)} className="px-3 py-1 text-xs">
                  返回预览
                </Button>
                <Button onClick={saveNote} disabled={saving || !dirty} className="px-3 py-1 text-xs">
                  {saving ? "保存中…" : "保存"}
                </Button>
              </div>
            </div>
            <div className="shrink-0 px-4 pt-3">
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
            <RichTextEditor
              key={note.id}
              fillHeight
              value={content}
              onChange={(md) => {
                setContent(md);
                setDirty(true);
              }}
              placeholder="开始书写，支持 Markdown…"
            />
          </Card>
        ) : (
          /* ---------- 预览模式 ---------- */
          <Card className="flex flex-col p-0">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-ink">{title || "未命名文档"}</span>
                {dirty && <span className="text-xs text-amber-500">有未保存的修改</span>}
              </div>
              <div className="flex items-center gap-2">
                <Dropdown
                  value={note.notebookId ?? ""}
                  onChange={moveNote}
                  options={[
                    { value: "", label: "未分类" },
                    ...notebooks.map((nb) => ({ value: nb.id, label: nb.name })),
                  ]}
                  className="w-36"
                />
                <Button onClick={() => setEditing(true)} className="px-3 py-1 text-xs">
                  编辑
                </Button>
                <button
                  onClick={() => deleteNote(note)}
                  className="inline-flex items-center rounded-lg px-3 py-1 text-xs text-muted transition-colors hover:bg-white/5 hover:text-red-300"
                >
                  删除
                </button>
              </div>
            </div>
            <div className="min-h-[420px] px-5 py-4">
              <MarkdownView content={content} />
            </div>
          </Card>
        )}
      </div>

      {/* 右键菜单 */}
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          onClose={() => setCtxMenu(null)}
          items={[
            { label: "重命名", icon: "✎", onClick: () => openNbModal(ctxMenu.notebook) },
            { label: "删除", icon: "🗑", danger: true, onClick: () => deleteNotebook(ctxMenu.notebook) },
          ]}
        />
      )}

      {/* 新建/重命名知识库弹窗 */}
      {nbModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setNbModalOpen(false)}>
          <div className="w-full max-w-sm rounded-xl bg-surface p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
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
