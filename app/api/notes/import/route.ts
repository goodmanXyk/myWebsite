import crypto from "crypto";
import type { RowDataPacket } from "mysql2";
import { pool } from "@/lib/server/db";
import { fail, json } from "@/lib/server/respond";
import { requireUser } from "@/lib/server/auth";
import mammoth from "mammoth";
import TurndownService from "turndown";
import * as XLSX from "xlsx";
import pdfParse from "pdf-parse/lib/pdf-parse.js";


const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const SUPPORTED = "md / txt / docx / xls / xlsx / csv / pdf";

function extOf(name: string): string {
  return (name.split(".").pop() || "").toLowerCase();
}

function titleFromName(name: string): string {
  const stem = name.replace(/\.[^.]+$/, "").trim();
  return stem || "导入文档";
}

function cellText(v: unknown): string {
  return String(v ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, " ")
    .trim();
}

function rowsToMarkdown(rows: unknown[][]): string {
  if (rows.length === 0) return "_空表_";
  const header = rows[0];
  const lines = [
    `| ${header.map(cellText).join(" | ")} |`,
    `| ${header.map(() => "---").join(" | ")} |`,
  ];
  const MAX_ROWS = 300;
  for (let i = 1; i < rows.length && lines.length - 2 < MAX_ROWS; i++) {
    lines.push(`| ${rows[i].map(cellText).join(" | ")} |`);
  }
  if (rows.length - 1 > MAX_ROWS) {
    lines.push(`_（表格共 ${rows.length - 1} 行，仅展示前 ${MAX_ROWS} 行）_`);
  }
  return lines.join("\n");
}

function workbookToMarkdown(wb: XLSX.WorkBook): string {
  return wb.SheetNames.map((name) => {
    const ws = wb.Sheets[name];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
      defval: "",
      raw: true,
    });
    return `## ${name}\n\n${rowsToMarkdown(rows)}`;
  }).join("\n\n");
}

// 导入文件并转为 Markdown 存入知识库
export async function POST(req: Request) {
  const user = await requireUser(req);
  if (!user) return fail("未登录", 401);

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return fail("请选择要导入的文件");
  if (file.size > MAX_BYTES) return fail("文件过大，请控制在 8MB 以内", 400);

  const notebookRaw = form.get("notebookId");
  const notebookId = notebookRaw && String(notebookRaw) !== "" ? String(notebookRaw) : null;
  if (notebookId) {
    const [nb] = await pool.execute<RowDataPacket[]>(
      "SELECT id FROM notebooks WHERE id = ? AND user_id = ?",
      [notebookId, user.id]
    );
    if (nb.length === 0) return fail("知识库不存在", 404);
  }

  const ext = extOf(file.name);
  const buffer = Buffer.from(await file.arrayBuffer());

  let content = "";
  try {
    switch (ext) {
      case "md":
      case "markdown":
      case "txt": {
        content = buffer.toString("utf8");
        break;
      }
      case "docx": {
        const result = await mammoth.convertToHtml({ buffer });
        const turndown = new TurndownService({
          headingStyle: "atx",
          codeBlockStyle: "fenced",
        });
        content = turndown.turndown(result.value);
        break;
      }
      case "xlsx":
      case "xls":
      case "csv": {
        const wb = XLSX.read(buffer, { type: "buffer" });
        content = workbookToMarkdown(wb);
        break;
      }
      case "pdf": {
        const result = await pdfParse(buffer);
        content = result.text.trim();
        break;
      }
      default:
        return fail(`暂不支持该格式，支持 ${SUPPORTED}`, 400);
    }
  } catch (e) {
    console.error("文件解析失败", e);
    return fail("文件解析失败，请确认文件未损坏", 400);
  }

  content = content.trim();
  if (!content) return fail("未能从文件中解析出内容", 400);

  const id = crypto.randomUUID();
  const now = Date.now();
  const title = titleFromName(file.name);
  await pool.execute(
    "INSERT INTO notes (id, user_id, notebook_id, title, content, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)",
    [id, user.id, notebookId, title, content, now, now]
  );

  return json({
    ok: true,
    note: { id, notebookId, title, content, createdAt: now, updatedAt: now },
  });
}