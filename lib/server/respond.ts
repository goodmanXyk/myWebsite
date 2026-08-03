// 统一的 JSON 响应工具
import { NextResponse } from "next/server";

export function json(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function ok(data: Record<string, unknown> = {}): NextResponse {
  return NextResponse.json({ ok: true, ...data });
}

export function fail(error: string, status = 400): NextResponse {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function readBody(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? body : {};
  } catch {
    return {};
  }
}
