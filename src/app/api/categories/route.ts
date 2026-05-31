import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const items = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    include: { _count: { select: { questionCategories: true } } },
  });
  return NextResponse.json({
    items: items.map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      sortOrder: c.sortOrder,
      questionCount: c._count.questionCategories,
    })),
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { name, color, sortOrder } = body as {
    name?: string;
    color?: string;
    sortOrder?: number;
  };
  if (!name || !name.trim()) {
    return NextResponse.json({ error: "カテゴリー名は必須です" }, { status: 400 });
  }
  const exists = await prisma.category.findUnique({ where: { name: name.trim() } });
  if (exists) {
    return NextResponse.json({ error: "同名のカテゴリーが既に存在します" }, { status: 409 });
  }
  const created = await prisma.category.create({
    data: {
      name: name.trim(),
      color: color || "#64748b",
      sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
    },
  });
  return NextResponse.json({ item: created }, { status: 201 });
}
