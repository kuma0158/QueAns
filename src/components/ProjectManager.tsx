"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Item = {
  id: number;
  name: string;
  description: string | null;
  sortOrder: number;
  total: number;
};

export function ProjectManager({ initialItems }: { initialItems: Item[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>(initialItems);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState<number>(
    (initialItems.at(-1)?.sortOrder ?? 0) + 10,
  );
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    setError(null);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, sortOrder }),
    });
    setAdding(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "追加に失敗しました");
      return;
    }
    const data = (await res.json()) as {
      item: { id: number; name: string; description: string | null; sortOrder: number };
    };
    setItems((p) => [...p, { ...data.item, total: 0 }]);
    setName("");
    setDescription("");
    setSortOrder((n) => n + 10);
    router.refresh();
  }

  async function save(item: Item, patch: Partial<Item>) {
    const res = await fetch(`/api/projects/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "更新に失敗しました");
      return;
    }
    setItems((p) => p.map((x) => (x.id === item.id ? { ...x, ...patch } : x)));
    router.refresh();
  }

  async function remove(item: Item) {
    if (item.total > 0) {
      alert(
        `「${item.name}」には ${item.total} 件の質問が紐付いているため削除できません。先に質問を削除してください。`,
      );
      return;
    }
    if (!confirm(`「${item.name}」を削除しますか？`)) return;
    const res = await fetch(`/api/projects/${item.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "削除に失敗しました");
      return;
    }
    setItems((p) => p.filter((x) => x.id !== item.id));
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="rounded-lg border bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">新規プロジェクト</h3>
        <div className="grid gap-3 md:grid-cols-[1fr_2fr_auto_auto]">
          <input
            placeholder="プロジェクト名"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
          />
          <input
            placeholder="説明（任意）"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
          />
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
            title="表示順"
            className="w-20 rounded-md border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={adding || !name.trim()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            追加
          </button>
        </div>
        {error && (
          <p className="mt-2 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}
      </form>

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-left text-xs uppercase text-slate-600">
            <tr>
              <th className="px-3 py-2">表示順</th>
              <th className="px-3 py-2">名前</th>
              <th className="px-3 py-2">説明</th>
              <th className="px-3 py-2">質問数</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                  プロジェクトがありません
                </td>
              </tr>
            )}
            {items.map((it) => (
              <ProjectRow
                key={it.id}
                item={it}
                onSave={(p) => save(it, p)}
                onDelete={() => remove(it)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProjectRow({
  item,
  onSave,
  onDelete,
}: {
  item: Item;
  onSave: (p: Partial<Item>) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description ?? "");
  const [sortOrder, setSortOrder] = useState(item.sortOrder);

  function startEdit() {
    setName(item.name);
    setDescription(item.description ?? "");
    setSortOrder(item.sortOrder);
    setEditing(true);
  }

  function commit() {
    onSave({ name, description: description || null, sortOrder });
    setEditing(false);
  }

  if (editing) {
    return (
      <tr className="border-t bg-blue-50/40">
        <td className="px-3 py-2">
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
            className="w-20 rounded-md border px-2 py-1 text-sm"
          />
        </td>
        <td className="px-3 py-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border px-2 py-1 text-sm"
          />
        </td>
        <td className="px-3 py-2">
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border px-2 py-1 text-sm"
          />
        </td>
        <td className="px-3 py-2 text-slate-500">{item.total}</td>
        <td className="px-3 py-2 text-right">
          <button
            onClick={commit}
            className="mr-1 rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
          >
            保存
          </button>
          <button
            onClick={() => setEditing(false)}
            className="rounded border px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
          >
            キャンセル
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t hover:bg-slate-50">
      <td className="px-3 py-2 text-slate-500 tabular-nums">{item.sortOrder}</td>
      <td className="px-3 py-2 font-medium text-slate-800">{item.name}</td>
      <td className="px-3 py-2 text-slate-600">{item.description ?? "—"}</td>
      <td className="px-3 py-2 text-slate-600 tabular-nums">{item.total}</td>
      <td className="px-3 py-2 text-right">
        <button
          onClick={startEdit}
          className="mr-1 rounded border px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
        >
          編集
        </button>
        <button
          onClick={onDelete}
          className="rounded border border-red-200 px-3 py-1 text-xs text-red-700 hover:bg-red-50"
        >
          削除
        </button>
      </td>
    </tr>
  );
}
