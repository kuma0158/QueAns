export type CategoryLite = { id: number; name: string; color: string };

export function CategoryBadge({ category }: { category: CategoryLite }) {
  return (
    <span
      className="inline-block rounded border px-2 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: `${category.color}1a`,
        borderColor: `${category.color}55`,
        color: category.color,
      }}
    >
      {category.name}
    </span>
  );
}

export function CategoryBadges({
  categories,
}: {
  categories: CategoryLite[];
}) {
  if (categories.length === 0) {
    return (
      <span className="inline-block rounded border border-dashed border-slate-300 px-2 py-0.5 text-xs text-slate-400">
        未分類
      </span>
    );
  }
  return (
    <span className="inline-flex flex-wrap gap-1">
      {categories.map((c) => (
        <CategoryBadge key={c.id} category={c} />
      ))}
    </span>
  );
}
