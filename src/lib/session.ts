import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { prisma } from "./db";

const COOKIE_NAME = "queans_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export type SessionUser = {
  id: number;
  username: string;
  displayName: string;
  role: string;
};

export async function createSession(userId: number) {
  const id = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await prisma.session.create({ data: { id, userId, expiresAt } });
  cookies().set(COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const c = cookies().get(COOKIE_NAME);
  if (c?.value) {
    await prisma.session.deleteMany({ where: { id: c.value } });
  }
  cookies().delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const c = cookies().get(COOKIE_NAME);
  if (!c?.value) return null;

  const session = await prisma.session.findUnique({
    where: { id: c.value },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return {
    id: session.user.id,
    username: session.user.username,
    displayName: session.user.displayName,
    role: session.user.role,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}
