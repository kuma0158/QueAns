import { QuestionForm } from "@/components/QuestionForm";
import { prisma } from "@/lib/db";

function isoDate(offsetDays: number) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export default async function NewQuestionPage({
  searchParams,
}: {
  searchParams: { projectId?: string };
}) {
  const [projects, categories] = await Promise.all([
    prisma.project.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      select: { id: true, name: true },
    }),
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      select: { id: true, name: true, color: true },
    }),
  ]);

  const preselect = Number(searchParams.projectId);
  const projectId =
    Number.isFinite(preselect) && projects.some((p) => p.id === preselect)
      ? preselect
      : (projects[0]?.id ?? null);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 text-xl font-bold">新規 質問登録</h1>
      {projects.length === 0 ? (
        <p className="rounded-md border border-dashed bg-white p-6 text-center text-sm text-slate-500">
          先にプロジェクトを作成してください。
        </p>
      ) : (
        <QuestionForm
          projects={projects}
          categories={categories}
          initial={{
            projectId,
            content: "",
            questioner: "",
            deadline: isoDate(3),
            answerText: "",
            answerer: "",
            status: "new",
            notes: "",
            categoryIds: [],
          }}
        />
      )}
    </div>
  );
}
