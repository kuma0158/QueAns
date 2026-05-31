import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import path from "path";
import fs from "fs/promises";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import {
  MAX_FILE_SIZE,
  attachmentDiskPath,
  ensureDir,
  questionUploadDir,
} from "@/lib/uploads";

type Ctx = { params: { id: string } };

const useBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export async function GET(_req: Request, { params }: Ctx) {
  const questionId = Number(params.id);
  if (!Number.isFinite(questionId))
    return NextResponse.json({ error: "bad id" }, { status: 400 });
  const items = await prisma.attachment.findMany({
    where: { questionId },
    orderBy: { id: "asc" },
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const questionId = Number(params.id);
  if (!Number.isFinite(questionId))
    return NextResponse.json({ error: "bad id" }, { status: 400 });

  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) return NextResponse.json({ error: "not found" }, { status: 404 });

  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0)
    return NextResponse.json({ error: "no files" }, { status: 400 });

  if (!useBlob()) await ensureDir(questionUploadDir(questionId));

  const created = [];
  for (const file of files) {
    if (file.size === 0) continue;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `${file.name} はサイズ上限(10MB)を超えています` },
        { status: 413 },
      );
    }
    const ext = path.extname(file.name);
    const storedName = `${Date.now()}_${randomBytes(8).toString("hex")}${ext}`;

    let storedField: string | null = null;
    let urlField: string | null = null;

    if (useBlob()) {
      const { put } = await import("@vercel/blob");
      const blob = await put(`questions/${questionId}/${storedName}`, file, {
        access: "public",
        contentType: file.type || "application/octet-stream",
        addRandomSuffix: false,
      });
      urlField = blob.url;
    } else {
      const buf = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(attachmentDiskPath(questionId, storedName), buf);
      storedField = storedName;
    }

    const row = await prisma.attachment.create({
      data: {
        questionId,
        storedName: storedField,
        url: urlField,
        originalName: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
      },
    });
    created.push(row);
  }

  return NextResponse.json({ items: created }, { status: 201 });
}
