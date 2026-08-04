// Markdown 编辑辅助：把格式化动作应用到 textarea 的选区/光标位置。
// 返回新的完整内容 + 插入后应选中的区间（供组件恢复光标）。

export type MarkdownAction =
  | "h1"
  | "h2"
  | "h3"
  | "bold"
  | "italic"
  | "strike"
  | "ul"
  | "ol"
  | "task"
  | "quote"
  | "code"
  | "codeblock"
  | "table"
  | "link"
  | "image"
  | "hr";

export interface MarkdownResult {
  value: string;
  selStart: number;
  selEnd: number;
}

export function applyMarkdownAction(
  action: MarkdownAction,
  value: string,
  s: number,
  e: number
): MarkdownResult {
  const sel = value.slice(s, e);
  const before = value.slice(0, s);
  const after = value.slice(e);
  const wrap = (marker: string, placeholder: string) => {
    const inner = sel || placeholder;
    const out = `${marker}${inner}${marker}`;
    return { value: before + out + after, selStart: s + marker.length, selEnd: s + marker.length + inner.length };
  };

  switch (action) {
    case "bold":
      return wrap("**", "加粗文字");
    case "italic":
      return wrap("*", "斜体文字");
    case "strike":
      return wrap("~~", "删除线文字");
    case "code":
      return wrap("`", "code");

    case "h1":
    case "h2":
    case "h3": {
      const prefix = action === "h1" ? "# " : action === "h2" ? "## " : "### ";
      const inner =
        sel.replace(/^#{1,6}\s*/, "") || (action === "h1" ? "一级标题" : action === "h2" ? "二级标题" : "三级标题");
      const out = prefix + inner;
      return { value: before + out + after, selStart: s + prefix.length, selEnd: s + prefix.length + inner.length };
    }

    case "ul":
    case "ol":
    case "task":
    case "quote": {
      const prefix =
        action === "ul" ? "- " : action === "ol" ? "1. " : action === "task" ? "- [ ] " : "> ";
      if (sel) {
        const lines = sel.split("\n").map((ln, i) =>
          action === "ol" ? `${i + 1}. ${ln}` : prefix + ln
        );
        const out = lines.join("\n");
        return { value: before + out + after, selStart: s, selEnd: s + out.length };
      }
      const placeholder =
        action === "task" ? "待办事项" : action === "quote" ? "引用内容" : "列表项";
      const out = prefix + placeholder;
      return { value: before + out + after, selStart: s + prefix.length, selEnd: s + prefix.length + placeholder.length };
    }

    case "codeblock": {
      const inner = sel || "在这里输入代码";
      const out = "\n```\n" + inner + "\n```\n";
      return { value: before + out + after, selStart: s + 5, selEnd: s + 5 + inner.length };
    }

    case "table": {
      const out = "\n| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| 内容 | 内容 | 内容 |\n";
      return { value: before + out + after, selStart: s + out.length, selEnd: s + out.length };
    }

    case "link": {
      const inner = sel || "链接文字";
      const url = "https://example.com";
      const out = `[${inner}](${url})`;
      return { value: before + out + after, selStart: s + inner.length + 3, selEnd: s + inner.length + 3 + url.length };
    }

    case "image": {
      const inner = sel || "图片描述";
      const url = "https://example.com/image.png";
      const out = `![${inner}](${url})`;
      return { value: before + out + after, selStart: s + inner.length + 4, selEnd: s + inner.length + 4 + url.length };
    }

    case "hr": {
      const out = "\n---\n";
      return { value: before + out + after, selStart: s + out.length, selEnd: s + out.length };
    }
  }
}
