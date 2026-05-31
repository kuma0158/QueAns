import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminHash = await bcrypt.hash("admin123", 10);
  const userHash = await bcrypt.hash("user123", 10);

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

  const admin = await prisma.user.upsert({
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

  const sampleProjects = [
    { name: "新人研修2026", description: "2026年度新卒エンジニア研修", sortOrder: 10 },
    { name: "OJT 第一期", description: "現場配属後のフォローアップ", sortOrder: 20 },
  ];
  for (const p of sampleProjects) {
    await prisma.project.upsert({
      where: { name: p.name },
      update: { description: p.description, sortOrder: p.sortOrder },
      create: p,
    });
  }

  const questionCount = await prisma.question.count();
  if (questionCount === 0) {
    const now = new Date();
    const addDays = (d: number) => {
      const t = new Date(now);
      t.setDate(t.getDate() + d);
      return t;
    };
    const proj1 = await prisma.project.findUnique({ where: { name: "新人研修2026" } });
    const proj2 = await prisma.project.findUnique({ where: { name: "OJT 第一期" } });
    const tech = await prisma.category.findUnique({ where: { name: "技術" } });
    const spec = await prisma.category.findUnique({ where: { name: "仕様" } });
    const ops = await prisma.category.findUnique({ where: { name: "運用" } });
    if (proj1 && proj2 && tech && spec && ops) {
      await prisma.question.create({
        data: {
          projectId: proj1.id,
          content: "PostgreSQL のインデックス設計について教えてください。",
          questioner: "新人A",
          deadline: addDays(3),
          createdById: admin.id,
          categories: { create: [{ categoryId: tech.id }] },
        },
      });
      await prisma.question.create({
        data: {
          projectId: proj1.id,
          content: "Git の rebase と merge の使い分けは？",
          questioner: "新人B",
          deadline: addDays(1),
          answerText: "feature ブランチの整理には rebase、共有後は merge を使うのが基本です。",
          answerer: "先輩X",
          status: "in_progress",
          createdById: admin.id,
          categories: { create: [{ categoryId: tech.id }] },
        },
      });
      await prisma.question.create({
        data: {
          projectId: proj2.id,
          content: "本番DBへのDDLを流す際の事前手順を共有してほしい。",
          questioner: "新人C",
          deadline: addDays(-2),
          notes: "緊急度高",
          createdById: admin.id,
          categories: {
            create: [{ categoryId: ops.id }, { categoryId: tech.id }],
          },
        },
      });
      await prisma.question.create({
        data: {
          projectId: proj2.id,
          content: "TypeScript の satisfies と as の使い分けが分かりません。",
          questioner: "新人D",
          deadline: addDays(-5),
          answerText: "satisfies は型を狭めつつチェック、as は強制キャスト。基本 satisfies を優先。",
          answerer: "先輩Y",
          status: "done",
          createdById: admin.id,
          categories: {
            create: [{ categoryId: tech.id }, { categoryId: spec.id }],
          },
        },
      });
    }
  }

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
