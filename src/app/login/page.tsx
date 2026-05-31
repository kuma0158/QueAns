"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("ユーザー名またはパスワードが違います");
      return;
    }
    router.push(redirect);
    router.refresh();
  }

  return (
    <div className="mx-auto mt-16 max-w-sm">
      <h1 className="mb-6 text-center text-2xl font-bold text-slate-800">QueAns ログイン</h1>
      <form onSubmit={onSubmit} className="rounded-lg border bg-white p-6 shadow-sm">
        <label className="mb-4 block">
          <span className="mb-1 block text-sm text-slate-600">ユーザー名</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-md border px-3 py-2 outline-none focus:border-blue-500"
            autoFocus
          />
        </label>
        <label className="mb-4 block">
          <span className="mb-1 block text-sm text-slate-600">パスワード</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border px-3 py-2 outline-none focus:border-blue-500"
          />
        </label>
        {error && (
          <p className="mb-3 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? "ログイン中..." : "ログイン"}
        </button>
        <p className="mt-4 text-center text-xs text-slate-500">
          初期: admin / admin123 ・ user / user123
        </p>
      </form>
    </div>
  );
}
