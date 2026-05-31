import path from "path";
import fs from "fs/promises";

export const UPLOAD_ROOT = process.env.UPLOAD_ROOT
  ? path.resolve(process.env.UPLOAD_ROOT)
  : path.resolve(process.cwd(), "uploads");
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function questionUploadDir(questionId: number) {
  return path.join(UPLOAD_ROOT, String(questionId));
}

export function attachmentDiskPath(questionId: number, storedName: string) {
  return path.join(questionUploadDir(questionId), storedName);
}

export async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}
