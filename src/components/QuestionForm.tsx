"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type CategoryOption = { id: number; name: string; color: string };
export type ProjectOption = { id: number; name: string };

export type QuestionFormData = {
  id?: number;
  projectId: number | null;
  content: string;
  questioner: string;
  deadline: string; // YYYY-MM-DD
  answerText: string;
  answerer: string;
  status: "new" | "in_progress" | "done";
  notes: string;
  categoryIds: number[];
};

const STATUS_OPTIONS = [
  { value: "new", label: "新規" },
  { value: "in_progress", label: "対応中" },
  { value: "done", label: "完了" },
] as const;

export function QuestionForm({
  initial,
  projects,
  categories,
  defaultRedirect,
}: {
  initial: QuestionFormData;
  projects: ProjectOption[];
  categories: CategoryOption[];
  defaultRedirect?: string;
}) {
  const router = useRouter();
  const isEdit = Boolean(initial.id);
  const [form, setForm] = useState<QuestionFormData>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof QuestionFormData>(key: K, v: QuestionFormData[K]) {
    setForm((p) => ({ ...p, [key]: v }));
  }

  function toggleCategory(id: number) {
    setForm((p) => {
      const set = new Set(p.categoryIds);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return { ...p, categoryIds: Array.from(set) };
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.projectId) {
      setError("プロジェクトを選択してください");
      return;
    }
    setSaving(true);
    setError(null);
    const url = isEdit ? `/api/questions/${form.id}` : "/api/questions";
    const method = isEdit ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "保存に失敗しました");
      return;
    }
    const data = (await res.json()) as { item: { id: number; projectId: number } };
    const back = defaultRedirect ?? `/projects/${data.item.projectId}`;
    router.push(back);
    router.refresh();
  }

  async function remove() {
    if (!isEdit) return;
    if (!confirm("この質問を削除しますか？")) return;
    const res = await fetch(`/api/questions/${form.id}`, { method: "DELETE" });
    if (res.ok) {
      const back = defaultRedirect ?? (form.projectId ? `/projects/${form.projectId}` : "/");
      router.push(back);
      router.refresh();
    }
  }

  const field = "w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-blue-500";
  const label = "mb-1 block text-xs font-medium text-slate-600";

  return (
    <form onSubmit={submit} className="space-y-4 rounded-lg border bg-white p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={label}>プロジェクト *</label>
          <select
            required
            value={form.projectId ?? ""}
            onChange={(e) =>
              update("projectId", e.target.value === "" ? null : Number(e.target.value))
            }
            className={field}
          >
            <option value="">選択してください</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>質問者 *</label>
          <input
            required
            value={form.questioner}
            onChange={(e) => update("questioner", e.target.value)}
            className={field}
          />
        </div>
      </div>

      <div>
        <label className={label}>カテゴリー（複数選択可）</label>
        {categories.length === 0 ? (
          <p className="text-xs text-slate-400">カテゴリーが未登録です</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const checked = form.categoryIds.includes(c.id);
              return (
                <label
                  key={c.id}
                  className={`cursor-pointer rounded-full border px-3 py-1 text-xs transition ${
                    checked ? "" : "bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                  style={
                    checked
                      ? {
                          backgroundColor: `${c.color}26`,
                          borderColor: c.color,
                          color: c.color,
                          fontWeight: 500,
                        }
                      : undefined
                  }
                >
                  <input
                    type="checkbox"
                    className="mr-1.5 align-middle accent-current"
                    checked={checked}
                    onChange={() => toggleCategory(c.id)}
                  />
                  {c.name}
                </label>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <label className={label}>確認事項 *</label>
        <textarea
          required
          rows={4}
          value={form.content}
          onChange={(e) => update("content", e.target.value)}
          className={field}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className={label}>期限 *</label>
          <input
            type="date"
            required
            value={form.deadline}
            onChange={(e) => update("deadline", e.target.value)}
            className={field}
          />
        </div>
        <div>
          <label className={label}>回答者</label>
          <input
            value={form.answerer}
            onChange={(e) => update("answerer", e.target.value)}
            className={field}
          />
        </div>
        <div>
          <label className={label}>ステータス</label>
          <select
            value={form.status}
            onChange={(e) => update("status", e.target.value as any)}
            className={field}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={label}>回答</label>
        <textarea
          rows={4}
          value={form.answerText}
          onChange={(e) => update("answerText", e.target.value)}
          className={field}
        />
      </div>

      <div>
        <label className={label}>備考</label>
        <textarea
          rows={2}
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
          className={field}
        />
      </div>

      {error && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="flex items-center justify-between pt-2">
        <div>
          {isEdit && (
            <button
              type="button"
              onClick={remove}
              className="rounded-md border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
            >
              削除
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "保存中..." : isEdit ? "更新" : "登録"}
          </button>
        </div>
      </div>
    </form>
  );
}
