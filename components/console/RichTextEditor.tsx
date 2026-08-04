"use client";

import { useEffect, useRef } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Markdown } from "tiptap-markdown";

interface Props {
  value: string;
  onChange: (md: string) => void;
  placeholder?: string;
  /** 固定高度模式下：内容区占满剩余空间并内部滚动（工具栏始终可见） */
  fillHeight?: boolean;
}

// ---------- 图标（内联 SVG） ----------
const icon = (path: React.ReactNode) => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {path}
  </svg>
);
const Icons = {
  undo: icon(<><path d="M9 14L4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></>),
  redo: icon(<><path d="M15 14l5-5-5-5" /><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" /></>),
  bulletList: icon(<><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><circle cx="3.5" cy="6" r="1" fill="currentColor" /><circle cx="3.5" cy="12" r="1" fill="currentColor" /><circle cx="3.5" cy="18" r="1" fill="currentColor" /></>),
  orderedList: icon(<><path d="M10 6h11" /><path d="M10 12h11" /><path d="M10 18h11" /><path d="M4 6h1v4" /><path d="M4 10h2" /><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" /></>),
  taskList: icon(<><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" /><path d="M7 6h13" /><path d="M7 12h13" /><path d="M7 18h13" /></>),
  quote: icon(<><path d="M6 17h3l2-4V7H5v6h3z" /><path d="M14 17h3l2-4V7h-6v6h3z" /></>),
  code: icon(<><path d="M16 18l6-6-6-6" /><path d="M8 6l-6 6 6 6" /></>),
  codeBlock: icon(<><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M10 9l-3 3 3 3" /><path d="M14 9l3 3-3 3" /></>),
  table: icon(<><rect x="3" y="4" width="18" height="16" rx="1" /><path d="M3 10h18" /><path d="M9 4v16" /></>),
  link: icon(<><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></>),
  image: icon(<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></>),
  hr: icon(<><path d="M3 12h18" /></>),
};

function ToolbarButton({
  title,
  onClick,
  active,
  children,
}: {
  title: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onMouseDown={(e) => e.preventDefault()} // 避免抢焦点导致选区丢失
      onClick={onClick}
      className={`flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-gray-100 hover:text-ink ${
        active ? "bg-gray-100 text-ink" : ""
      }`}
    >
      {children}
    </button>
  );
}

function FontSizeSelect({ editor }: { editor: Editor }) {
  const level =
    editor.isActive("heading", { level: 1 }) ? "h1"
    : editor.isActive("heading", { level: 2 }) ? "h2"
    : editor.isActive("heading", { level: 3 }) ? "h3"
    : editor.isActive("heading", { level: 4 }) ? "h4"
    : "p";
  const label = level === "p" ? "正文" : `标题 ${level[1]}`;
  return (
    <select
      title="字号"
      aria-label="字号"
      value={level}
      onChange={(e) => {
        const v = e.target.value;
        if (v === "p") editor.chain().focus().setParagraph().run();
        else editor.chain().focus().toggleHeading({ level: Number(v[1]) as 1 | 2 | 3 | 4 }).run();
      }}
      className="h-7 rounded-md border border-line bg-white px-1.5 text-xs text-muted outline-none hover:text-ink focus:border-ink"
    >
      <option value="p">正文</option>
      <option value="h1">标题 1</option>
      <option value="h2">标题 2</option>
      <option value="h3">标题 3</option>
      <option value="h4">标题 4</option>
    </select>
  );
}

export function RichTextEditor({ value, onChange, placeholder, fillHeight = false }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder }),
      Link.configure({ openOnClick: false, autolink: true, defaultProtocol: "https" }),
      Image.configure({ allowBase64: true }),
      Markdown,
    ],
    content: "",
    onUpdate: ({ editor: ed }) => {
      onChange(ed.storage.markdown.getMarkdown());
    },
    immediatelyRender: false,
    editorProps: {
      attributes: { class: "rich-editor" },
    },
  });

  // 挂载时载入 Markdown 内容（页面通过 key 重挂载来切换文档）
  useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(value || "", false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  // 本地图片上传：客户端压缩后转 base64 嵌入
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("链接地址（留空可取消链接）", prev || "https://");
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    const href = /^https?:\/\//.test(url) ? url : `https://${url}`;
    if (editor.state.selection.empty) {
      editor.chain().focus().insertContent({
        type: "text",
        marks: [{ type: "link", attrs: { href } }],
        text: href.replace(/^https?:\/\//, ""),
      }).run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    }
  };

  const compressImage = (dataUrl: string, cb: (out: string) => void, maxDim = 1600, quality = 0.85) => {
    const img = new window.Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return cb(dataUrl);
      ctx.drawImage(img, 0, 0, width, height);
      const isPng = dataUrl.startsWith("data:image/png");
      cb(canvas.toDataURL(isPng ? "image/png" : "image/jpeg", isPng ? undefined : quality));
    };
    img.onerror = () => cb(dataUrl);
    img.src = dataUrl;
  };

  const handleImageFile = (file: File | null) => {
    if (!file || !editor) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      compressImage(dataUrl, (out) => {
        editor.chain().focus().setImage({ src: out }).run();
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={fillHeight ? "flex min-h-0 flex-1 flex-col" : "flex flex-col"}>
      {/* 隐藏的文件选择框（本地图片） */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleImageFile(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />

      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-line px-2 py-1.5">
        <ToolbarButton title="撤销" onClick={() => editor.chain().focus().undo().run()} active={editor.can().undo()}>{Icons.undo}</ToolbarButton>
        <ToolbarButton title="重做" onClick={() => editor.chain().focus().redo().run()} active={editor.can().redo()}>{Icons.redo}</ToolbarButton>
        <span className="mx-1 h-4 w-px bg-line" />
        <FontSizeSelect editor={editor} />
        <span className="mx-1 h-4 w-px bg-line" />
        <ToolbarButton title="加粗" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}>
          <span className="text-sm font-bold">B</span>
        </ToolbarButton>
        <ToolbarButton title="斜体" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}>
          <span className="text-sm italic">I</span>
        </ToolbarButton>
        <ToolbarButton title="删除线" onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")}>
          <span className="text-sm line-through">S</span>
        </ToolbarButton>
        <span className="mx-1 h-4 w-px bg-line" />
        <ToolbarButton title="无序列表" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}>{Icons.bulletList}</ToolbarButton>
        <ToolbarButton title="有序列表" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")}>{Icons.orderedList}</ToolbarButton>
        <ToolbarButton title="任务清单" onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive("taskList")}>{Icons.taskList}</ToolbarButton>
        <ToolbarButton title="引用" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")}>{Icons.quote}</ToolbarButton>
        <span className="mx-1 h-4 w-px bg-line" />
        <ToolbarButton title="行内代码" onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")}>{Icons.code}</ToolbarButton>
        <ToolbarButton title="代码块" onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")}>{Icons.codeBlock}</ToolbarButton>
        <ToolbarButton title="插入表格" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
          {Icons.table}
        </ToolbarButton>
        <ToolbarButton title="插入链接" onClick={setLink} active={editor.isActive("link")}>{Icons.link}</ToolbarButton>
        <ToolbarButton title="插入本地图片" onClick={() => fileInputRef.current?.click()}>{Icons.image}</ToolbarButton>
        <ToolbarButton title="分割线" onClick={() => editor.chain().focus().setHorizontalRule().run()}>{Icons.hr}</ToolbarButton>

        {/* 表格操作（光标在表格内时显示） */}
        {editor.isActive("table") && (
          <>
            <span className="mx-1 h-4 w-px bg-line" />
            <ToolbarButton title="上方插入行" onClick={() => editor.chain().focus().addRowBefore().run()}>
              <span className="text-xs">↑行</span>
            </ToolbarButton>
            <ToolbarButton title="下方插入行" onClick={() => editor.chain().focus().addRowAfter().run()}>
              <span className="text-xs">↓行</span>
            </ToolbarButton>
            <ToolbarButton title="删除当前行" onClick={() => editor.chain().focus().deleteRow().run()}>
              <span className="text-xs text-red-500">−行</span>
            </ToolbarButton>
            <ToolbarButton title="左侧插入列" onClick={() => editor.chain().focus().addColumnBefore().run()}>
              <span className="text-xs">←列</span>
            </ToolbarButton>
            <ToolbarButton title="右侧插入列" onClick={() => editor.chain().focus().addColumnAfter().run()}>
              <span className="text-xs">→列</span>
            </ToolbarButton>
            <ToolbarButton title="删除当前列" onClick={() => editor.chain().focus().deleteColumn().run()}>
              <span className="text-xs text-red-500">−列</span>
            </ToolbarButton>
            <ToolbarButton title="删除整个表格" onClick={() => editor.chain().focus().deleteTable().run()}>
              <span className="text-xs text-red-500">✕表</span>
            </ToolbarButton>
          </>
        )}
      </div>

      {/* 编辑器 */}
      <div className={fillHeight ? "min-h-0 flex-1 overflow-y-auto px-4 py-2" : "min-h-[420px] px-4 py-2"}>
        <EditorContent editor={editor} className="outline-none" />
      </div>
    </div>
  );
}
