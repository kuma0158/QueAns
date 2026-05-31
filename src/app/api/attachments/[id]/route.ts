import { NextResponse } from "next/server";
import fs from "fs/promises";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { attachmentDiskPath } from "@/lib/uploads";

type Ctx = { params: { id: string } };

export async function GET(req: Request, { params }: Ctx) {
  const id = Number(params.id);
  if (!Number.isFinite(id))
    return NextResponse.json({ error: "bad id" }, { status: 400 });
  const att = await prisma.attachment.findUnique({ where: { id } });
  if (!att) return NextResponse.json({ error: "not found" }, { status: 404 });

  let body: Uint8Array | null = null;
  if (att.url) {
    const res = await fetch(att.url);
    if (!res.ok)
      return NextResponse.json({ error: "blob fetch failed" }, { status: 502 });
    body = new Uint8Array(await res.arrayBuffer());
  } else if (att.storedName) {
    const fileBuf = await fs
      .readFile(attachmentDiskPath(att.questionId, att.storedName))
      .catch(() => null);
    if (fileBuf) body = new Uint8Array(fileBuf);
  }
  if (!body) return NextResponse.json({ error: "file missing" }, { status: 404 });

  const url = new URL(req.url);
  const isDownload = url.searchParams.get("download") === "1";
  const dispositionType = isDownload ? "attachment" : "inline";
  const encodedName = encodeURIComponent(att.originalName);

  return new NextResponse(body as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": att.mimeType,
      "Content-Length": String(body.byteLength),
      "Content-Disposition": `${dispositionType}; filename*=UTF-8''${encodedName}`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const id = Number(params.id);
  if (!Number.isFinite(id))
    return NextResponse.json({ error: "bad id" }, { status: 400 });

  const att = await prisma.attachment.findUnique({ where: { id } });
  if (!att) return NextResponse.json({ ok: true });

  if (att.url) {
    const { del } = await import("@vercel/blob");
    await del(att.url).catch(() => {});
  } else if (att.storedName) {
    await fs
      .unlink(attachmentDiskPath(att.questionId, att.storedName))
      .catch(() => {});
  }
  await prisma.attachment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
