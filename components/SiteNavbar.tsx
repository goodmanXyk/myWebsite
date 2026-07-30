"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "./Logo";
import { Button } from "./ui/Button";
import { useAuth } from "@/lib/auth";

export function SiteNavbar() {
  const { user, loading } = useAuth();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Logo />
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
        </div>
        <div className="flex items-center gap-3">
          {!loading && user ? (
            <Button
              variant="secondary"
              onClick={() => router.push("/console")}
            >
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
    </header>
  );
}
