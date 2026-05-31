import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { QuestionForm } from "@/components/QuestionForm";
import { AttachmentManager } from "@/components/AttachmentManager";

export default async function EditQuestionPage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();
  const [item, projects, categories] = await Promise.all([
    prisma.question.findUnique({
      where: { id },
      include: {
        attachments: { orderBy: { id: "asc" } },
        categories: { select: { categoryId: true } },
      },
    }),
    prisma.project.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      select: { id: true, name: true },
    }),
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      select: { id: true, name: true, color: true },
    }),
  ]);
  if (!item) notFound();

  const deadline = item.deadline.toISOString().slice(0, 10);
  const status = (["new", "in_progress", "done"].includes(item.status)
    ? item.status
    : "new") as "new" | "in_progress" | "done";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-xl font-bold">質問編集 #{item.id}</h1>
      <QuestionForm
        projects={projects}
        categories={categories}
        initial={{
          id: item.id,
          projectId: item.projectId,
          content: item.content,
          questioner: item.questioner,
          deadline,
          answerText: item.answerText ?? "",
          answerer: item.answerer ?? "",
          status,
          notes: item.notes ?? "",
          categoryIds: item.categories.map((c) => c.categoryId),
        }}
      />
      <AttachmentManager questionId={item.id} initialItems={item.attachments} />
    </div>
  );
}
