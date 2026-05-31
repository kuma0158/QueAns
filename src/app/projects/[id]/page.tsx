import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { resolveDisplayStatus } from "@/lib/status";
import { StatusBadge } from "@/components/StatusBadge";
import { CategoryBadges } from "@/components/CategoryBadge";
import { QuestionFilters } from "@/components/QuestionFilters";

type SP = { status?: string; q?: string; category?: string };

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: SP;
}) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) notFound();

  const { status, q, category } = searchParams;
  const where: any = { projectId: id };
  if (status === "new" || status === "in_progress" || status === "done") {
    where.status = status;
  } else if (status === "overdue") {
    where.status = { not: "done" };
    where.deadline = { lt: new Date() };
  }
  if (category === "none") {
    where.categories = { none: {} };
  } else if (category) {
    const cid = Number(category);
    if (Number.isFinite(cid)) where.categories = { some: { categoryId: cid } };
  }
  if (q) {
    where.OR = [
      { content: { contains: q } },
      { questioner: { contains: q } },
      { answerer: { contains: q } },
    ];
  }

  const [items, categories] = await Promise.all([
    prisma.question.findMany({
      where,
      orderBy: [{ deadline: "asc" }, { id: "desc" }],
      include: { categories: { include: { category: true } } },
    }),
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      select: { id: true, name: true, color: true },
    }),
  ]);

  const fmt = (d: Date) =>
    d.toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" });

  return (
    <div>
      <div className="mb-2 text-xs text-slate-500">
        <Link href="/" className="hover:underline">
          ← プロジェクト一覧
        </Link>
      </div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{project.name}</h1>
          {project.description && (
            <p className="mt-1 text-sm text-slate-500">{project.description}</p>
          )}
        </div>
        <Link
          href={`/questions/new?projectId=${project.id}`}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          + 新規質問
        </Link>
      </div>

      <QuestionFilters
        status={status ?? ""}
        q={q ?? ""}
        category={category ?? ""}
        categories={categories}
        basePath={`/projects/${project.id}`}
      />

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-left text-xs uppercase text-slate-600">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">カテゴリー</th>
              <th className="px-3 py-2">確認事項</th>
              <th className="px-3 py-2">質問者</th>
              <th className="px-3 py-2">起票日</th>
              <th className="px-3 py-2">期限</th>
              <th className="px-3 py-2">回答者</th>
              <th className="px-3 py-2">ステータス</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-slate-400">
                  該当する質問はありません
                </td>
              </tr>
            )}
            {items.map((it) => {
              const ds = resolveDisplayStatus(it.status, it.deadline);
              const cats = it.categories.map((qc) => qc.category);
              return (
                <tr key={it.id} className="border-t hover:bg-slate-50">
                  <td className="px-3 py-2 text-slate-500">{it.id}</td>
                  <td className="px-3 py-2">
                    <CategoryBadges categories={cats} />
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/questions/${it.id}`}
                      className="block max-w-md truncate text-slate-800 hover:text-blue-600 hover:underline"
                      title={it.content}
                    >
                      {it.content}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{it.questioner}</td>
                  <td className="px-3 py-2 text-slate-600">{fmt(it.createdDate)}</td>
                  <td
                    className={`px-3 py-2 ${
                      ds === "overdue" ? "font-semibold text-red-600" : "text-slate-600"
                    }`}
                  >
                    {fmt(it.deadline)}
                  </td>
                  <td className="px-3 py-2 text-slate-600">{it.answerer ?? "—"}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={ds} />
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/questions/${it.id}/edit`}
                      className="text-blue-600 hover:underline"
                    >
                      編集
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
