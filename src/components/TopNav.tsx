"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { SessionUser } from "@/lib/session";

export function TopNav({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    { href: "/", label: "プロジェクト" },
    { href: "/dashboard", label: "ダッシュボード" },
    { href: "/categories", label: "カテゴリー管理" },
  ];

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold text-slate-800">
            QueAns
            <span className="ml-2 text-xs font-normal text-slate-500">社員研修QA管理</span>
          </Link>
          {user && (
            <nav className="flex gap-1">
              {tabs.map((t) => {
                const active =
                  t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
                return (
                  <Link
                    key={t.href}
                    href={t.href}
                    className={`rounded-md px-3 py-1.5 text-sm transition ${
                      active
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {t.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <span className="text-slate-600">
                {user.displayName}
                <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                  {user.role === "admin" ? "管理者" : "一般"}
                </span>
              </span>
              <button
                onClick={logout}
                className="rounded-md border px-3 py-1 text-slate-600 hover:bg-slate-50"
              >
                ログアウト
              </button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
