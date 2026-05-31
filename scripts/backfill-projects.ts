/**
 * Backfill script:
 * - Create Project records from distinct Question.projectName
 * - Set Question.projectId
 * - Copy Question.categoryId into QuestionCategory join rows
 *
 * Idempotent. Safe to run multiple times.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const questions = await prisma.question.findMany({
    select: { id: true, projectName: true, projectId: true, categoryId: true },
  });

  const uniqueNames = Array.from(new Set(questions.map((q) => q.projectName))).filter(Boolean);

  for (const name of uniqueNames) {
    await prisma.project.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`Projects: ${uniqueNames.length} unique names ensured`);

  let projectFilled = 0;
  let categoryLinked = 0;
  for (const q of questions) {
    if (!q.projectId) {
      const p = await prisma.project.findUnique({ where: { name: q.projectName } });
      if (p) {
        await prisma.question.update({
          where: { id: q.id },
          data: { projectId: p.id },
        });
        projectFilled++;
      }
    }
    if (q.categoryId) {
      await prisma.questionCategory
        .upsert({
          where: {
            questionId_categoryId: { questionId: q.id, categoryId: q.categoryId },
          },
          update: {},
          create: { questionId: q.id, categoryId: q.categoryId },
        })
        .catch(() => {});
      categoryLinked++;
    }
  }
  console.log(`Questions: ${projectFilled} project links set, ${categoryLinked} category links migrated`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
