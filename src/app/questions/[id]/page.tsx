import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { resolveDisplayStatus } from "@/lib/status";
import { StatusBadge } from "@/components/StatusBadge";
import { CategoryBadges } from "@/components/CategoryBadge";
import { AttachmentList } from "@/components/AttachmentList";

export default async function QuestionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();
  const q = await prisma.question.findUnique({
    where: { id },
    include: {
      attachments: { orderBy: { id: "asc" } },
      project: true,
      categories: { include: { category: true } },
    },
  });
  if (!q) notFound();

  const ds = resolveDisplayStatus(q.status, q.deadline);
  const fmt = (d: Date) => d.toLocaleDateString("ja-JP");
  const cats = q.categories.map((qc) => qc.category);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-2 text-xs text-slate-500">
        <Link href="/" className="hover:underline">
          プロジェクト
        </Link>
        <span className="mx-1">/</span>
        <Link href={`/projects/${q.project.id}`} className="hover:underline">
          {q.project.name}
        </Link>
        <span className="mx-1">/</span>
        <span>質問 #{q.id}</span>
      </div>
      <div className="mb-4 flex items-center justify-between">
        <Link href={`/projects/${q.project.id}`} className="text-sm text-slate-600 hover:underline">
          ← {q.project.name} に戻る
        </Link>
        <Link
          href={`/questions/${q.id}/edit`}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          編集する
        </Link>
      </div>

      <article className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <header className="border-b bg-slate-50 px-6 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500">#{q.id}</span>
            <h1 className="text-lg font-bold text-slate-800">{q.project.name}</h1>
            <StatusBadge status={ds} />
          </div>
          <div className="mt-2">
            <CategoryBadges categories={cats} />
          </div>
          <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-600 sm:grid-cols-4">
            <div>
              <dt className="text-slate-400">起票日</dt>
              <dd>{fmt(q.createdDate)}</dd>
            </div>
            <div>
              <dt className="text-slate-400">期限</dt>
              <dd className={ds === "overdue" ? "font-semibold text-red-600" : ""}>
                {fmt(q.deadline)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">質問者</dt>
              <dd>{q.questioner}</dd>
            </div>
            <div>
              <dt className="text-slate-400">回答者</dt>
              <dd>{q.answerer ?? "—"}</dd>
            </div>
          </dl>
        </header>

        <div className="space-y-5 px-6 py-5">
          <section>
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500">
              <span className="rounded bg-blue-100 px-1.5 py-0.5 text-blue-700">Q</span>
              確認事項
            </div>
            <p className="whitespace-pre-wrap rounded-md border bg-slate-50 p-4 text-sm text-slate-800">
              {q.content}
            </p>
          </section>

          <section>
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500">
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-emerald-700">A</span>
              回答
            </div>
            {q.answerText ? (
              <p className="whitespace-pre-wrap rounded-md border bg-emerald-50/40 p-4 text-sm text-slate-800">
                {q.answerText}
              </p>
            ) : (
              <p className="rounded-md border border-dashed p-4 text-sm text-slate-400">
                未回答
              </p>
            )}
          </section>

          {q.notes && (
            <section>
              <div className="mb-2 text-xs font-medium text-slate-500">備考</div>
              <p className="whitespace-pre-wrap rounded-md border bg-slate-50 p-4 text-sm text-slate-700">
                {q.notes}
              </p>
            </section>
          )}

          <section>
            <div className="mb-2 text-xs font-medium text-slate-500">
              添付ファイル ({q.attachments.length})
            </div>
            <AttachmentList items={q.attachments} />
          </section>
        </div>
      </article>
    </div>
  );
}
