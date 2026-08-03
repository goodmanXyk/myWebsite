"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { getStore } from "@/lib/store";
import type { WebhookKind } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

const store = getStore();

export default function SettingsPage() {
  const { user } = useAuth();
  const { show } = useToast();
  const [enabled, setEnabled] = useState(true);
  const [leadMinutes, setLeadMinutes] = useState(0);
  const [wecom, setWecom] = useState("");
  const [dingtalk, setDingtalk] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const s = await store.notify.getSettings(user.id);
        setEnabled(s.enabled);
        setLeadMinutes(s.leadMinutes);
        setWecom(s.webhooks.wecom ?? "");
        setDingtalk(s.webhooks.dingtalk ?? "");
      } catch (e) {
        console.error("加载通知设置失败", e);
      } finally {
        setLoaded(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    try {
      await store.notify.saveSettings(user.id, {
        enabled,
        leadMinutes: Math.max(0, Number(leadMinutes) || 0),
        webhooks: {
          wecom: wecom.trim() || undefined,
          dingtalk: dingtalk.trim() || undefined,
        },
      });
      show("通知设置已保存 ✅", "success");
    } catch (e) {
      show(e instanceof Error ? e.message : "保存失败", "warning");
    }
  };

  const handleTest = (kind: WebhookKind) => {
    if (!user) return;
    const url = kind === "wecom" ? wecom.trim() : dingtalk.trim();
    if (!url) {
      show(`请先填写${kind === "wecom" ? "企业微信" : "钉钉"}机器人 Webhook 地址`, "warning");
      return;
    }
    store.notify.simulatePush(kind, {
      type: "todo_reminder",
      title: "【测试推送】待办提醒",
      body: "这是一条来自 AI 工作流的测试消息。",
      webhooks: { [kind]: url },
    });
    show(`已模拟推送至${kind === "wecom" ? "企业微信" : "钉钉"}（查看浏览器控制台）`, "success");
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink">设置</h1>
        <p className="mt-1 text-sm text-muted">
          Settings · 配置待办到期提醒与内部消息推送（企业微信 / 钉钉）
        </p>
      </div>

      <Card className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-ink">应用内到期提醒</p>
            <p className="text-xs text-muted">
              应用打开期间，待办到期时自动弹出提醒（每 30 秒轮询）
            </p>
          </div>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-4 w-4 accent-brand"
            />
            <span className="text-sm text-muted">{enabled ? "开启" : "关闭"}</span>
          </label>
        </div>

        <Input
          type="number"
          min={0}
          value={leadMinutes}
          onChange={(e) => setLeadMinutes(Number(e.target.value))}
          label="提前提醒分钟数 / Lead minutes"
        />
        <p className="text-xs text-muted">
          （提前提醒为后续后台能力预留参数，当前阶段仍以「到期即提醒」为准）
        </p>

        <div className="border-t border-line pt-4">
          <p className="mb-1 text-sm font-medium text-ink">企业微信机器人 Webhook</p>
          <p className="mb-3 text-xs text-muted">
            粘贴企业微信群机器人 Webhook 地址，待办到期时推送至内部群（真实推送需接入后端）
          </p>
          <div className="flex items-end gap-2">
            <Input
              value={wecom}
              onChange={(e) => setWecom(e.target.value)}
              placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=..."
              className="flex-1"
            />
            <Button variant="secondary" onClick={() => handleTest("wecom")}>
              模拟推送
            </Button>
          </div>
        </div>

        <div className="border-t border-line pt-4">
          <p className="mb-1 text-sm font-medium text-ink">钉钉机器人 Webhook</p>
          <p className="mb-3 text-xs text-muted">
            粘贴钉钉群机器人 Webhook 地址（含 access_token），同上
          </p>
          <div className="flex items-end gap-2">
            <Input
              value={dingtalk}
              onChange={(e) => setDingtalk(e.target.value)}
              placeholder="https://oapi.dingtalk.com/robot/send?access_token=..."
              className="flex-1"
            />
            <Button variant="secondary" onClick={() => handleTest("dingtalk")}>
              模拟推送
            </Button>
          </div>
        </div>

        <div className="flex justify-end border-t border-line pt-4">
          <Button onClick={handleSave} disabled={!loaded}>
            保存设置
          </Button>
        </div>
      </Card>

      <Card className="mt-4 border-l-4 border-l-amber-400">
        <p className="text-xs text-muted">
          ℹ️ 当前为前端 Mock 阶段：Webhook 地址仅做配置与「模拟推送」（在浏览器控制台打印将要发送的
          JSON 负载）。真实 HTTP 推送需在后续接入后端 / Next API Route，届时只需在
          <code className="mx-1 rounded bg-gray-100 px-1">simulatePush</code>
          处替换为实际请求即可。
        </p>
      </Card>
    </div>
  );
}
