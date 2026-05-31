import { formatBytes, isImageMime } from "@/lib/attachment-utils";

export type AttachmentItem = {
  id: number;
  originalName: string;
  mimeType: string;
  size: number;
};

export function AttachmentList({ items }: { items: AttachmentItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-400">添付ファイルはありません</p>;
  }
  const images = items.filter((a) => isImageMime(a.mimeType));
  const others = items.filter((a) => !isImageMime(a.mimeType));

  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((a) => (
            <a
              key={a.id}
              href={`/api/attachments/${a.id}`}
              target="_blank"
              rel="noreferrer"
              className="group block overflow-hidden rounded-md border bg-slate-50 hover:border-blue-400"
              title={a.originalName}
            >
              <div className="aspect-square overflow-hidden bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/attachments/${a.id}`}
                  alt={a.originalName}
                  className="h-full w-full object-contain transition group-hover:scale-105"
                />
              </div>
              <div className="truncate border-t bg-white px-2 py-1 text-xs text-slate-600">
                {a.originalName}
              </div>
            </a>
          ))}
        </div>
      )}

      {others.length > 0 && (
        <ul className="divide-y rounded-md border bg-white">
          {others.map((a) => (
            <li key={a.id} className="flex items-center justify-between px-3 py-2 text-sm">
              <div className="min-w-0 flex-1 truncate">
                <span className="mr-2 text-slate-400">📎</span>
                <span className="text-slate-800">{a.originalName}</span>
                <span className="ml-2 text-xs text-slate-400">
                  {a.mimeType} ・ {formatBytes(a.size)}
                </span>
              </div>
              <a
                href={`/api/attachments/${a.id}?download=1`}
                className="ml-3 shrink-0 rounded border px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
              >
                ダウンロード
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
