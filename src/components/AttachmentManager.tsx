"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { formatBytes, isImageMime } from "@/lib/attachment-utils";
import type { AttachmentItem } from "./AttachmentList";

export function AttachmentManager({
  questionId,
  initialItems,
}: {
  questionId: number;
  initialItems: AttachmentItem[];
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<AttachmentItem[]>(initialItems);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("files", f));
    const res = await fetch(`/api/questions/${questionId}/attachments`, {
      method: "POST",
      body: fd,
    });
    setUploading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "アップロードに失敗しました");
      return;
    }
    const data = (await res.json()) as { items: AttachmentItem[] };
    setItems((prev) => [...prev, ...data.items]);
    if (fileInput.current) fileInput.current.value = "";
    router.refresh();
  }

  async function remove(id: number) {
    if (!confirm("この添付ファイルを削除しますか？")) return;
    const res = await fetch(`/api/attachments/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((a) => a.id !== id));
      router.refresh();
    }
  }

  return (
    <div className="space-y-3 rounded-lg border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">添付ファイル ({items.length})</h2>
        <label className="cursor-pointer rounded-md border bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50">
          {uploading ? "アップロード中..." : "+ ファイル追加"}
          <input
            ref={fileInput}
            type="file"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={(e) => upload(e.target.files)}
          />
        </label>
      </div>

      <p className="text-xs text-slate-400">
        画像 (PNG/JPG/GIF/WebP 等) はプレビュー表示、その他はダウンロードリンクで表示されます。1ファイル最大10MB。
      </p>

      {error && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {items.length === 0 ? (
        <p className="rounded border border-dashed p-3 text-center text-xs text-slate-400">
          添付ファイルはまだありません
        </p>
      ) : (
        <ul className="divide-y rounded-md border">
          {items.map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-3 py-2">
              {isImageMime(a.mimeType) ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={`/api/attachments/${a.id}`}
                  alt={a.originalName}
                  className="h-12 w-12 shrink-0 rounded border object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded border bg-slate-50 text-lg">
                  📎
                </div>
              )}
              <div className="min-w-0 flex-1">
                <a
                  href={`/api/attachments/${a.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate text-sm text-slate-800 hover:text-blue-600 hover:underline"
                >
                  {a.originalName}
                </a>
                <div className="text-xs text-slate-400">
                  {a.mimeType} ・ {formatBytes(a.size)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => remove(a.id)}
                className="shrink-0 rounded border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
              >
                削除
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
