import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "bad id" }, { status: 400 });
  const item = await prisma.question.findUnique({
    where: { id },
    include: {
      project: true,
      categories: { include: { category: true } },
    },
  });
  if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const id = Number(params.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "bad id" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const data: any = {};
  for (const key of ["content", "questioner", "answerText", "answerer", "notes"] as const) {
    if (body[key] !== undefined) data[key] = body[key] || null;
  }
  if (body.deadline !== undefined) data.deadline = new Date(body.deadline);
  if (body.status !== undefined && ["new", "in_progress", "done"].includes(body.status)) {
    data.status = body.status;
  }
  if (body.projectId !== undefined) {
    const pid = Number(body.projectId);
    if (Number.isFinite(pid)) data.projectId = pid;
  }

  if (Array.isArray(body.categoryIds)) {
    const cleanCatIds = Array.from(
      new Set(
        (body.categoryIds as Array<number | string>)
          .map((v) => Number(v))
          .filter((n) => Number.isFinite(n)),
      ),
    );
    await prisma.$transaction([
      prisma.questionCategory.deleteMany({ where: { questionId: id } }),
      prisma.questionCategory.createMany({
        data: cleanCatIds.map((categoryId) => ({ questionId: id, categoryId })),
      }),
      prisma.question.update({ where: { id }, data }),
    ]);
  } else {
    await prisma.question.update({ where: { id }, data });
  }

  const item = await prisma.question.findUnique({
    where: { id },
    include: { project: true, categories: { include: { category: true } } },
  });
  return NextResponse.json({ item });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const id = Number(params.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "bad id" }, { status: 400 });
  await prisma.question.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
