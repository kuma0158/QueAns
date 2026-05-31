import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const q = url.searchParams.get("q");
  const categoryParam = url.searchParams.get("category");
  const projectParam = url.searchParams.get("project");

  const where: any = {};
  if (status === "new" || status === "in_progress" || status === "done") {
    where.status = status;
  } else if (status === "overdue") {
    where.status = { not: "done" };
    where.deadline = { lt: new Date() };
  }
  if (projectParam) {
    const pid = Number(projectParam);
    if (Number.isFinite(pid)) where.projectId = pid;
  }
  if (categoryParam === "none") {
    where.categories = { none: {} };
  } else if (categoryParam) {
    const cid = Number(categoryParam);
    if (Number.isFinite(cid)) where.categories = { some: { categoryId: cid } };
  }
  if (q) {
    where.OR = [
      { content: { contains: q } },
      { questioner: { contains: q } },
      { answerer: { contains: q } },
      { project: { name: { contains: q } } },
    ];
  }

  const items = await prisma.question.findMany({
    where,
    orderBy: [{ deadline: "asc" }, { id: "desc" }],
    include: {
      project: true,
      categories: { include: { category: true } },
    },
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const {
    projectId,
    content,
    questioner,
    deadline,
    answerText,
    answerer,
    status,
    notes,
    categoryIds,
  } = body as {
    projectId?: number | string;
    content?: string;
    questioner?: string;
    deadline?: string;
    answerText?: string;
    answerer?: string;
    status?: string;
    notes?: string;
    categoryIds?: Array<number | string>;
  };

  const pid = Number(projectId);
  if (!Number.isFinite(pid)) {
    return NextResponse.json({ error: "プロジェクトは必須です" }, { status: 400 });
  }
  if (!content || !questioner || !deadline) {
    return NextResponse.json(
      { error: "content, questioner, deadline は必須です" },
      { status: 400 },
    );
  }

  const cleanCatIds = Array.isArray(categoryIds)
    ? Array.from(
        new Set(
          categoryIds
            .map((v) => Number(v))
            .filter((n) => Number.isFinite(n)),
        ),
      )
    : [];

  const created = await prisma.question.create({
    data: {
      projectId: pid,
      content,
      questioner,
      deadline: new Date(deadline),
      answerText: answerText || null,
      answerer: answerer || null,
      status: status === "in_progress" || status === "done" ? status : "new",
      notes: notes || null,
      createdById: user.id,
      categories: {
        create: cleanCatIds.map((categoryId) => ({ categoryId })),
      },
    },
  });
  return NextResponse.json({ item: created }, { status: 201 });
}
