"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Item = {
  id: number;
  name: string;
  color: string;
  sortOrder: number;
  questionCount: number;
};

const PRESET_COLORS = [
  "#3b82f6",
  "#f97316",
  "#10b981",
  "#ec4899",
  "#8b5cf6",
  "#eab308",
  "#06b6d4",
  "#ef4444",
  "#64748b",
];

export function CategoryManager({ initialItems }: { initialItems: Item[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>(initialItems);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
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
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color, sortOrder }),
    });
    setAdding(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "追加に失敗しました");
      return;
    }
    const data = (await res.json()) as { item: Omit<Item, "questionCount"> };
    setItems((p) => [...p, { ...data.item, questionCount: 0 }]);
    setName("");
    setSortOrder((n) => n + 10);
    router.refresh();
  }

  async function save(item: Item, patch: Partial<Item>) {
    const res = await fetch(`/api/categories/${item.id}`, {
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
    const msg =
      item.questionCount > 0
        ? `「${item.name}」を削除すると、${item.questionCount}件の質問が「未分類」になります。削除しますか？`
        : `「${item.name}」を削除しますか？`;
    if (!confirm(msg)) return;
    const res = await fetch(`/api/categories/${item.id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((p) => p.filter((x) => x.id !== item.id));
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={add}
        className="rounded-lg border bg-white p-5 shadow-sm"
      >
        <h2 className="mb-3 text-sm font-semibold text-slate-700">新規カテゴリー</h2>
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
          <input
            placeholder="カテゴリー名"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
          />
          <ColorPicker value={color} onChange={setColor} />
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
              <th className="px-3 py-2">カテゴリー名</th>
              <th className="px-3 py-2">色</th>
              <th className="px-3 py-2">使用件数</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                  カテゴリーがありません
                </td>
              </tr>
            )}
            {items.map((it) => (
              <CategoryRow
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

function CategoryRow({
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
  const [color, setColor] = useState(item.color);
  const [sortOrder, setSortOrder] = useState(item.sortOrder);

  function startEdit() {
    setName(item.name);
    setColor(item.color);
    setSortOrder(item.sortOrder);
    setEditing(true);
  }

  function commit() {
    onSave({ name, color, sortOrder });
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
          <ColorPicker value={color} onChange={setColor} />
        </td>
        <td className="px-3 py-2 text-slate-500">{item.questionCount}</td>
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
      <td className="px-3 py-2">
        <span
          className="inline-block rounded border px-2 py-0.5 text-xs font-medium"
          style={{
            backgroundColor: `${item.color}1a`,
            borderColor: `${item.color}55`,
            color: item.color,
          }}
        >
          {item.name}
        </span>
      </td>
      <td className="px-3 py-2">
        <span className="inline-flex items-center gap-2 text-xs text-slate-500">
          <span
            className="h-4 w-4 rounded border"
            style={{ backgroundColor: item.color }}
          />
          {item.color}
        </span>
      </td>
      <td className="px-3 py-2 text-slate-600 tabular-nums">{item.questionCount}</td>
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

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {PRESET_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`h-6 w-6 rounded-full border-2 transition ${
            value === c ? "border-slate-900" : "border-transparent hover:border-slate-300"
          }`}
          style={{ backgroundColor: c }}
          title={c}
          aria-label={`色 ${c}`}
        />
      ))}
    </div>
  );
}
