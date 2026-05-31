import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date();
  const [total, doneCount, inProgress, newCount, overdue, projects] = await Promise.all([
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
  ]);

  const progressRate = total === 0 ? 0 : Math.round((doneCount / total) * 1000) / 10;

  return NextResponse.json({
    total,
    done: doneCount,
    inProgress,
    new: newCount,
    overdue,
    progressRate,
    byProject: projects.map((p) => ({
      id: p.id,
      project: p.name,
      count: p._count.questions,
    })),
  });
}
