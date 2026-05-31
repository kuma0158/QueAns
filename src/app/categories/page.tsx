import { prisma } from "@/lib/db";
import { CategoryManager } from "@/components/CategoryManager";

export default async function CategoriesPage() {
  const items = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    include: { _count: { select: { questionCategories: true } } },
  });
  const initial = items.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
    sortOrder: c.sortOrder,
    questionCount: c._count.questionCategories,
  }));
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 text-xl font-bold">カテゴリー管理</h1>
      <CategoryManager initialItems={initial} />
    </div>
  );
}
