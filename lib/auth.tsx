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
    name?: string
  ) => Promise<{ ok: boolean; error?: string }>;
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
    async (email: string, password: string, name?: string) => {
      const res = await getStore().auth.register(email, password, name);
      if (res.ok && res.user) setUser(res.user);
      return { ok: res.ok, error: res.error };
    },
    []
  );

  const logout = useCallback(() => {
    getStore().auth.logout();
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
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
