import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function DashboardPage() {
  const now = new Date();
  const [total, doneCount, inProgress, newCount, overdue, byProject, recentOverdue, byCategory] =
    await Promise.all([
      prisma.question.count(),
      prisma.question.count({ where: { status: "done" } }),
      prisma.question.count({ where: { status: "in_progress" } }),
      prisma.question.count({ where: { status: "new" } }),
      prisma.question.count({
        where: { status: { not: "done" }, deadline: { lt: now } },
      }),
      prisma.project.findMany({
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        include: { _count: { select: { questions: true } } },
      }),
      prisma.question.findMany({
        where: { status: { not: "done" }, deadline: { lt: now } },
        orderBy: { deadline: "asc" },
        take: 10,
        include: { project: true },
      }),
      prisma.category.findMany({
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        include: { _count: { select: { questionCategories: true } } },
      }),
    ]);

  const progressRate = total === 0 ? 0 : Math.round((doneCount / total) * 1000) / 10;

  const stats = [
    { label: "全件数", value: total, color: "bg-slate-100 text-slate-800" },
    { label: "新規", value: newCount, color: "bg-blue-100 text-blue-800" },
    { label: "対応中", value: inProgress, color: "bg-amber-100 text-amber-800" },
    { label: "完了", value: doneCount, color: "bg-emerald-100 text-emerald-800" },
    { label: "期限超過", value: overdue, color: "bg-red-100 text-red-800" },
  ];

  const maxProject = Math.max(...byProject.map((p) => p._count.questions), 1);
  const maxCat = Math.max(...byCategory.map((c) => c._count.questionCategories), 1);

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">ダッシュボード</h1>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-lg border p-4 ${s.color}`}>
            <div className="text-xs">{s.label}</div>
            <div className="mt-1 text-3xl font-bold tabular-nums">{s.value}</div>
          </div>
        ))}
      </div>

      <section className="mb-6 rounded-lg border bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">進捗率</h2>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-3xl font-bold text-slate-800 tabular-nums">{progressRate}%</span>
          <span className="text-xs text-slate-500">
            {doneCount} / {total} 件 完了
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${progressRate}%` }}
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">プロジェクト別 件数</h2>
          {byProject.length === 0 ? (
            <p className="text-sm text-slate-400">データがありません</p>
          ) : (
            <ul className="space-y-2">
              {byProject.map((p) => {
                const c = p._count.questions;
                const pct = (c / maxProject) * 100;
                return (
                  <li key={p.id}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <Link
                        href={`/projects/${p.id}`}
                        className="text-slate-700 hover:text-blue-600 hover:underline"
                      >
                        {p.name}
                      </Link>
                      <span className="tabular-nums text-slate-500">{c}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-lg border bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">カテゴリー別 件数</h2>
          {byCategory.length === 0 ? (
            <p className="text-sm text-slate-400">データがありません</p>
          ) : (
            <ul className="space-y-2">
              {byCategory.map((c) => {
                const count = c._count.questionCategories;
                const pct = (count / maxCat) * 100;
                return (
                  <li key={c.id}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-slate-700">{c.name}</span>
                      <span className="tabular-nums text-slate-500">{count}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: c.color }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-lg border bg-white p-5 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">期限超過 (未完了)</h2>
          {recentOverdue.length === 0 ? (
            <p className="text-sm text-slate-400">期限超過の質問はありません</p>
          ) : (
            <ul className="divide-y">
              {recentOverdue.map((q) => (
                <li key={q.id} className="py-2">
                  <Link
                    href={`/questions/${q.id}`}
                    className="flex items-center justify-between gap-2 hover:bg-slate-50"
                  >
                    <span className="truncate text-sm text-slate-800">
                      <span className="text-slate-400">#{q.id}</span>{" "}
                      <span className="text-slate-500">[{q.project.name}]</span> {q.content}
                    </span>
                    <span className="shrink-0 text-xs text-red-600">
                      {q.deadline.toLocaleDateString("ja-JP")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
