"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const STATUS_FILTERS: { key: string; label: string }[] = [
  { key: "", label: "すべて" },
  { key: "new", label: "新規" },
  { key: "in_progress", label: "対応中" },
  { key: "done", label: "完了" },
  { key: "overdue", label: "期限超過" },
];

type CategoryOpt = { id: number; name: string; color: string };

export function QuestionFilters({
  status,
  q,
  category,
  categories,
  basePath,
}: {
  status: string;
  q: string;
  category: string;
  categories: CategoryOpt[];
  basePath: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [text, setText] = useState(q);

  function buildHref(overrides: Record<string, string | null>) {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(overrides)) {
      if (v === null || v === "") sp.delete(k);
      else sp.set(k, v);
    }
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(buildHref({ q: text || null }));
  }

  return (
    <div className="mb-4 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500">ステータス:</span>
        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map((f) => {
            const active = (status || "") === f.key;
            return (
              <Link
                key={f.key}
                href={buildHref({ status: f.key || null })}
                className={`rounded-md border px-3 py-1 text-xs ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {f.label}
              </Link>
            );
          })}
        </div>
        <form onSubmit={onSearch} className="ml-auto flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="内容・氏名で検索"
            className="w-64 rounded-md border px-3 py-1 text-sm"
          />
          <button
            type="submit"
            className="rounded-md border bg-white px-3 py-1 text-sm hover:bg-slate-50"
          >
            検索
          </button>
        </form>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500">カテゴリー:</span>
        <div className="flex flex-wrap gap-1">
          {[{ key: "", label: "すべて", color: "" }]
            .concat(
              categories.map((c) => ({
                key: String(c.id),
                label: c.name,
                color: c.color,
              })),
            )
            .concat([{ key: "none", label: "未分類", color: "" }])
            .map((f) => {
              const active = (category || "") === f.key;
              const style =
                f.color && !active
                  ? {
                      backgroundColor: `${f.color}1a`,
                      borderColor: `${f.color}55`,
                      color: f.color,
                    }
                  : undefined;
              return (
                <Link
                  key={f.key}
                  href={buildHref({ category: f.key || null })}
                  style={style}
                  className={`rounded-md border px-3 py-1 text-xs ${
                    active
                      ? "border-slate-900 bg-slate-900 text-white"
                      : !f.color
                        ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        : "hover:opacity-80"
                  }`}
                >
                  {f.label}
                </Link>
              );
            })}
        </div>
      </div>
    </div>
  );
}
