import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const items = await prisma.project.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    include: { _count: { select: { questions: true } } },
  });
  return NextResponse.json({
    items: items.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      sortOrder: p.sortOrder,
      questionCount: p._count.questions,
    })),
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { name, description, sortOrder } = body as {
    name?: string;
    description?: string;
    sortOrder?: number;
  };
  if (!name || !name.trim()) {
    return NextResponse.json({ error: "プロジェクト名は必須です" }, { status: 400 });
  }
  const exists = await prisma.project.findUnique({ where: { name: name.trim() } });
  if (exists) {
    return NextResponse.json({ error: "同名のプロジェクトが既に存在します" }, { status: 409 });
  }
  const created = await prisma.project.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
    },
  });
  return NextResponse.json({ item: created }, { status: 201 });
}
