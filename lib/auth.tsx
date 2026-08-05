"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { getStore } from "@/lib/store";
import type { User } from "@/lib/store/types";

export type { User } from "@/lib/store/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (
    email: string,
    password: string,
    name?: string,
    code?: string
  ) => Promise<{ ok: boolean; error?: string }>;
  sendCode: (
    email: string,
    purpose: "register" | "reset"
  ) => Promise<{ ok: boolean; error?: string; message?: string }>;
  resetPassword: (
    email: string,
    code: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string; message?: string }>;
  changePassword: (
    oldPassword: string,
    newPassword: string
  ) => Promise<{ ok: boolean; error?: string; message?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setUser(getStore().auth.getSession());
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await getStore().auth.login(email, password);
    if (res.ok && res.user) setUser(res.user);
    return { ok: res.ok, error: res.error };
  }, []);

  const register = useCallback(
    async (email: string, password: string, name?: string, code?: string) => {
      const res = await getStore().auth.register(email, password, name, code);
      if (res.ok && res.user) setUser(res.user);
      return { ok: res.ok, error: res.error };
    },
    []
  );

  const sendCode = useCallback(
    async (email: string, purpose: "register" | "reset") => {
      return getStore().auth.sendCode(email, purpose);
    },
    []
  );

  const resetPassword = useCallback(
    async (email: string, code: string, password: string) => {
      return getStore().auth.resetPassword(email, code, password);
    },
    []
  );

  const changePassword = useCallback(
    async (oldPassword: string, newPassword: string) => {
      const res = await getStore().auth.changePassword(oldPassword, newPassword);
      if (res.ok) {
        // 服务端已使所有会话失效，清除本地会话并回登录页
        getStore().auth.logout();
        setUser(null);
        router.push("/login");
      }
      return res;
    },
    [router]
  );

  const logout = useCallback(() => {
    getStore().auth.logout();
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, sendCode, resetPassword, changePassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
