"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { getStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

const store = getStore();

export default function SettingsPage() {
  const { user, changePassword } = useAuth();
  const { show } = useToast();
  const [enabled, setEnabled] = useState(true);
  const [leadMinutes, setLeadMinutes] = useState(0);
  const [wecom, setWecom] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const s = await store.notify.getSettings(user.id);
        setEnabled(s.enabled);
        setLeadMinutes(s.leadMinutes);
        setWecom(s.webhooks.wecom ?? "");
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
        },
      });
      show("通知设置已保存 ✅", "success");
    } catch (e) {
      show(e instanceof Error ? e.message : "保存失败", "warning");
    }
  };

  const handleSendTest = async () => {
    if (!user) return;
    setTesting(true);
    try {
      const res = await store.notify.sendTest(user.id);
      if (!res.ok) {
        show(res.error || "发送失败", "warning");
      } else {
        const parts = [res.data?.email, res.data?.wecom].filter(Boolean);
        show(parts.join("；") || "已发送测试消息", "success");
      }
    } catch (e) {
      show(e instanceof Error ? e.message : "发送失败", "warning");
    } finally {
      setTesting(false);
    }
  };

  // 修改密码
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  const handleChangePassword = async () => {
    setPwError("");
    if (newPassword.length < 6) {
      setPwError("新密码至少需要 6 位");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("两次输入的新密码不一致");
      return;
    }
    setChangingPw(true);
    const res = await changePassword(oldPassword, newPassword);
    setChangingPw(false);
    if (!res.ok) {
      setPwError(res.error || "修改失败");
    }
    // 成功时 useAuth 内部会清会话并跳转登录页
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink">设置</h1>
        <p className="mt-1 text-sm text-muted">
          Settings · 配置待办到期提醒（企业微信邮箱邮件 / 应用内 / 企业微信群）
        </p>
      </div>

      <Card className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-ink">应用内到期提醒</p>
            <p className="text-xs text-muted">
              应用打开期间，待办到期时自动弹出提醒（每 30 秒轮询，所有账号均适用）
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
          到期前提前 N 分钟触发提醒（后台每 5 分钟扫描一次，建议 ≥5 分钟）
        </p>

        <div className="border-t border-line pt-4">
          <p className="mb-1 text-sm font-medium text-ink">企业微信邮箱邮件提醒</p>
          <p className="mb-2 text-xs text-muted">
            使用 @fai.xin 企业微信邮箱注册的账号，待办到期时自动发送邮件，在企业微信客户端即可收到提醒；
            非企业微信邮箱账号仅使用上方「应用内提醒」。
          </p>
          <Button variant="secondary" onClick={handleSendTest} disabled={testing}>
            {testing ? "发送中…" : "发送测试提醒"}
          </Button>
        </div>

        <div className="border-t border-line pt-4">
          <p className="mb-1 text-sm font-medium text-ink">企业微信群机器人 Webhook（可选）</p>
          <p className="mb-3 text-xs text-muted">
            粘贴企业微信群机器人 Webhook 地址，待办到期时除邮件外同时推送至群消息（不填则仅邮件/应用内）
          </p>
          <Input
            value={wecom}
            onChange={(e) => setWecom(e.target.value)}
            placeholder="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=..."
          />
        </div>

        <div className="flex justify-end border-t border-line pt-4">
          <Button onClick={handleSave} disabled={!loaded}>
            保存设置
          </Button>
        </div>
      </Card>

      <Card className="mt-4 flex flex-col gap-4">
        <div>
          <p className="text-sm font-medium text-ink">修改密码</p>
          <p className="text-xs text-muted">修改后需要重新登录</p>
        </div>
        <Input
          type="password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          label="当前密码 / Current password"
          autoComplete="current-password"
        />
        <Input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          label="新密码 / New password"
          autoComplete="new-password"
          placeholder="至少 6 位"
        />
        <Input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          label="确认新密码 / Confirm new password"
          autoComplete="new-password"
          error={pwError || undefined}
        />
        <div className="flex justify-end">
          <Button onClick={handleChangePassword} disabled={changingPw}>
            {changingPw ? "修改中…" : "修改密码"}
          </Button>
        </div>
      </Card>
    </div>
  );
}