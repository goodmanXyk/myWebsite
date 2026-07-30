"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "./Logo";
import { Button } from "./ui/Button";
import { useAuth } from "@/lib/auth";

export function SiteNavbar() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const close = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink transition-colors hover:bg-gray-100 md:hidden"
            aria-label="打开菜单"
          >
            <span className="text-lg leading-none">☰</span>
          </button>
          <Logo />
        </div>
        <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
          <Link href="/" className="transition-colors hover:text-ink">
            Home
          </Link>
          <Link href="/console" className="transition-colors hover:text-ink">
            Dashboard
          </Link>
          <Link href="#" className="transition-colors hover:text-ink">
            Docs
          </Link>
          <Link href="#" className="transition-colors hover:text-ink">
            Pricing
          </Link>
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          {!loading && user ? (
            <Button variant="secondary" onClick={() => router.push("/console")}>
              控制台
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => router.push("/login")}
              >
                Log in
              </Button>
              <Button onClick={() => router.push("/register")}>Sign up</Button>
            </>
          )}
        </div>
      </div>

      {/* 移动端下拉菜单 */}
      {menuOpen && (
        <div className="border-t border-line bg-white md:hidden">
          <nav className="flex flex-col px-2 py-2">
            <Link
              href="/"
              onClick={close}
              className="rounded-lg px-3 py-2.5 text-sm text-ink transition-colors hover:bg-gray-50"
            >
              Home
            </Link>
            <Link
              href="/console"
              onClick={close}
              className="rounded-lg px-3 py-2.5 text-sm text-ink transition-colors hover:bg-gray-50"
            >
              Dashboard
            </Link>
            <Link
              href="#"
              onClick={close}
              className="rounded-lg px-3 py-2.5 text-sm text-muted transition-colors hover:bg-gray-50"
            >
              Docs
            </Link>
            <Link
              href="#"
              onClick={close}
              className="rounded-lg px-3 py-2.5 text-sm text-muted transition-colors hover:bg-gray-50"
            >
              Pricing
            </Link>
          </nav>
          <div className="flex flex-col gap-2 border-t border-line px-4 py-3">
            {!loading && user ? (
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  close();
                  router.push("/console");
                }}
              >
                控制台
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={() => {
                    close();
                    router.push("/login");
                  }}
                >
                  Log in
                </Button>
                <Button
                  fullWidth
                  onClick={() => {
                    close();
                    router.push("/register");
                  }}
                >
                  Sign up
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
