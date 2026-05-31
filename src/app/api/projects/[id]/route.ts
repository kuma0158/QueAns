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
    if (!trimmed)
      return NextResponse.json({ error: "プロジェクト名は必須です" }, { status: 400 });
    const dup = await prisma.project.findFirst({
      where: { name: trimmed, NOT: { id } },
    });
    if (dup)
      return NextResponse.json(
        { error: "同名のプロジェクトが既に存在します" },
        { status: 409 },
      );
    data.name = trimmed;
  }
  if (body.description !== undefined) {
    data.description =
      typeof body.description === "string" && body.description.trim()
        ? body.description.trim()
        : null;
  }
  if (typeof body.sortOrder === "number") data.sortOrder = body.sortOrder;

  const updated = await prisma.project.update({ where: { id }, data });
  return NextResponse.json({ item: updated });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const id = Number(params.id);
  if (!Number.isFinite(id))
    return NextResponse.json({ error: "bad id" }, { status: 400 });

  const count = await prisma.question.count({ where: { projectId: id } });
  if (count > 0) {
    return NextResponse.json(
      {
        error: `このプロジェクトには ${count} 件の質問が紐付いています。先に質問を削除または別プロジェクトに移してください。`,
      },
      { status: 409 },
    );
  }
  await prisma.project.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
