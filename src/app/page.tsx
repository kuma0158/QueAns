import Link from "next/link";
import { prisma } from "@/lib/db";
import { ProjectManager } from "@/components/ProjectManager";

export default async function HomePage() {
  const projects = await prisma.project.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    include: {
      _count: { select: { questions: true } },
      questions: { select: { status: true, deadline: true } },
    },
  });

  const now = Date.now();
  const summaries = projects.map((p) => {
    const total = p._count.questions;
    let done = 0;
    let overdue = 0;
    let open = 0;
    for (const q of p.questions) {
      if (q.status === "done") done++;
      else {
        open++;
        if (q.deadline.getTime() < now) overdue++;
      }
    }
    const progress = total === 0 ? 0 : Math.round((done / total) * 100);
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      sortOrder: p.sortOrder,
      total,
      open,
      done,
      overdue,
      progress,
    };
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">プロジェクト ({summaries.length})</h1>
      </div>

      {summaries.length === 0 ? (
        <p className="mb-6 rounded-md border border-dashed bg-white p-6 text-center text-sm text-slate-400">
          プロジェクトがまだありません。下のフォームから作成してください。
        </p>
      ) : (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {summaries.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="block rounded-lg border bg-white p-4 shadow-sm transition hover:border-blue-400 hover:shadow"
            >
              <div className="mb-1 flex items-center justify-between">
                <h2 className="truncate text-base font-semibold text-slate-800">{p.name}</h2>
                <span className="ml-2 shrink-0 text-xs text-slate-400">{p.total}件</span>
              </div>
              {p.description && (
                <p className="mb-2 line-clamp-2 text-xs text-slate-500">{p.description}</p>
              )}
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${p.progress}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs">
                <span className="text-slate-500">進捗 {p.progress}%</span>
                <span className="space-x-2">
                  <span className="text-amber-600">未完了 {p.open}</span>
                  {p.overdue > 0 && (
                    <span className="font-semibold text-red-600">超過 {p.overdue}</span>
                  )}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">プロジェクト管理</h2>
        <ProjectManager initialItems={summaries} />
      </section>
    </div>
  );
}
