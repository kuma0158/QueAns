import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

type Ctx = { params: { id: string } };

export async function PATCH(req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const id = Number(params.id);
  if (!Number.isFinite(id))
    return NextResponse.json({ error: "bad id" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const data: any = {};
  if (typeof body.name === "string") {
    const trimmed = body.name.trim();
    if (!trimmed) {
      return NextResponse.json({ error: "カテゴリー名は必須です" }, { status: 400 });
    }
    const dup = await prisma.category.findFirst({
      where: { name: trimmed, NOT: { id } },
    });
    if (dup)
      return NextResponse.json(
        { error: "同名のカテゴリーが既に存在します" },
        { status: 409 },
      );
    data.name = trimmed;
  }
  if (typeof body.color === "string") data.color = body.color;
  if (typeof body.sortOrder === "number") data.sortOrder = body.sortOrder;

  const updated = await prisma.category.update({ where: { id }, data });
  return NextResponse.json({ item: updated });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const id = Number(params.id);
  if (!Number.isFinite(id))
    return NextResponse.json({ error: "bad id" }, { status: 400 });

  // onDelete: SetNull: 既存質問の categoryId は null になる
  await prisma.category.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
