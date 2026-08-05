// 通知发送工具：SMTP 邮件 + 企业微信群机器人 Webhook
// 配置走环境变量（Vercel / .env.local）：SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / SMTP_FROM
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.exmail.qq.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!SMTP_USER || !SMTP_PASS) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return transporter;
}

/** SMTP 是否已配置（未配置时邮件通道静默跳过，不影响其他功能） */
export function isMailConfigured(): boolean {
  return Boolean(SMTP_USER && SMTP_PASS);
}

/** 是否为企业微信邮箱（腾讯企业邮域名 fai.xin，MX = mxbiz*.qq.com） */
export function isEnterpriseWecomEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith("@fai.xin");
}

/** 发送邮件；返回是否成功（未配置 SMTP 时返回 false） */
export async function sendMail(
  to: string,
  subject: string,
  text: string,
  html?: string
): Promise<boolean> {
  const tr = getTransporter();
  if (!tr) return false;
  try {
    await tr.sendMail({
      from: `"OvixAI 待办提醒" <${SMTP_FROM}>`,
      to,
      subject,
      text,
      html: html || undefined,
    });
    return true;
  } catch (e) {
    console.error("邮件发送失败", e);
    return false;
  }
}

/** 推送企业微信群机器人消息（markdown/text）；返回是否成功 */
export async function sendWecomWebhook(
  webhookUrl: string,
  content: string
): Promise<boolean> {
  if (!webhookUrl) return false;
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ msgtype: "text", text: { content } }),
    });
    const data = (await res.json().catch(() => ({}))) as { errcode?: number };
    if (!res.ok || data.errcode !== 0) {
      console.error("企微群消息发送失败", res.status, JSON.stringify(data));
      return false;
    }
    return true;
  } catch (e) {
    console.error("企微群消息发送异常", e);
    return false;
  }
}