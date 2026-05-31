// Turso に対して seed (prisma/seed.ts と同じ内容) を流す。
//
// 使い方:
//   $env:TURSO_DATABASE_URL = "libsql://<your-db>.turso.io"
//   $env:TURSO_AUTH_TOKEN   = "<token>"
//   npx tsx prisma/seed.ts
//
// prisma/seed.ts は PrismaClient を使い、TURSO_DATABASE_URL があれば src/lib/db.ts 経由ではなく
// デフォルトの DATABASE_URL に向くので、ここでは driverAdapters 経由で実行する代替スクリプトとして提供する。
// → 実態は: 上記の env を設定した上で、`npm run db:seed:turso` を実行する。

import { PrismaClient } from "@prisma/client";
import { createClient } from "@libsql/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const url = process.env.TURSO_DATABASE_URL;
if (!url) {
  console.error("TURSO_DATABASE_URL is required");
  process.exit(1);
}

const libsql = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
const adapter = new PrismaLibSQL(libsql);
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD ?? "admin123", 10);
  const userHash = await bcrypt.hash(process.env.SEED_USER_PASSWORD ?? "user123", 10);

  const initialCategories = [
    { name: "仕様", color: "#f97316", sortOrder: 10 },
    { name: "バグ", color: "#ef4444", sortOrder: 20 },
    { name: "技術", color: "#10b981", sortOrder: 30 },
    { name: "運用", color: "#8b5cf6", sortOrder: 40 },
    { name: "その他", color: "#64748b", sortOrder: 90 },
  ];
  for (const c of initialCategories) {
    await prisma.category.upsert({
      where: { name: c.name },
      update: { color: c.color, sortOrder: c.sortOrder },
      create: c,
    });
  }

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash: adminHash,
      displayName: "管理者",
      role: "admin",
    },
  });
  await prisma.user.upsert({
    where: { username: "user" },
    update: {},
    create: {
      username: "user",
      passwordHash: userHash,
      displayName: "一般ユーザー",
      role: "user",
    },
  });

  console.log("Turso seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
