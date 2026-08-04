"use client";

import type { MarkdownAction } from "@/lib/markdown";

interface Item {
  action: MarkdownAction;
  label: string;
  title: string;
}

// 分组展示，视觉上区分不同类别的功能
const groups: { name: string; items: Item[] }[] = [
  {
    name: "标题",
    items: [
      { action: "h1", label: "H1", title: "一级标题" },
      { action: "h2", label: "H2", title: "二级标题" },
      { action: "h3", label: "H3", title: "三级标题" },
    ],
  },
  {
    name: "文字",
    items: [
      { action: "bold", label: "B", title: "加粗" },
      { action: "italic", label: "I", title: "斜体" },
      { action: "strike", label: "S", title: "删除线" },
    ],
  },
  {
    name: "列表",
    items: [
      { action: "ul", label: "• 列表", title: "无序列表" },
      { action: "ol", label: "1. 编号", title: "有序列表" },
      { action: "task", label: "☑ 任务", title: "任务清单" },
      { action: "quote", label: "❝ 引用", title: "引用" },
    ],
  },
  {
    name: "代码",
    items: [
      { action: "code", label: "` 代码", title: "行内代码" },
      { action: "codeblock", label: "``` 代码块", title: "代码块" },
    ],
  },
  {
    name: "更多",
    items: [
      { action: "table", label: "表格", title: "插入表格" },
      { action: "link", label: "链接", title: "插入链接" },
      { action: "image", label: "图片", title: "插入图片" },
      { action: "hr", label: "分割线", title: "插入分割线" },
    ],
  },
];

export function MarkdownToolbar({ onAction }: { onAction: (a: MarkdownAction) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-1 border-b border-line px-3 py-1.5">
      {groups.map((g) => (
        <div key={g.name} className="flex items-center gap-1">
          <div className="flex items-center gap-0.5">
            {g.items.map((it) => (
              <button
                key={it.action}
                type="button"
                title={it.title}
                aria-label={it.title}
                onClick={() => onAction(it.action)}
                className="rounded-md px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-gray-100 hover:text-ink"
              >
                {it.label}
              </button>
            ))}
          </div>
          <span className="mx-1.5 h-4 w-px bg-line" aria-hidden />
        </div>
      ))}
      <span className="ml-auto hidden text-[11px] text-muted sm:inline">
        💡 选中文字后点按钮即可应用格式，或用 Ctrl/Cmd + S 保存
      </span>
    </div>
  );
}
