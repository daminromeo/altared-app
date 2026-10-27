import Link from "next/link"
import {
  CATEGORY_LABELS,
  type PostCategory,
} from "@/lib/blog/types"

type Item = { category: PostCategory; count: number }

export function CategoryNav({
  categories,
  active,
  totalCount,
}: {
  categories: Item[]
  active?: PostCategory
  totalCount: number
}) {
  return (
    <nav aria-label="Blog categories" className="flex flex-wrap gap-2">
      <Link
        href="/blog"
        className={pillClass(active === undefined)}
      >
        All <span className="ml-1 text-ink-muted">({totalCount})</span>
      </Link>
      {categories.map(({ category, count }) => (
        <Link
          key={category}
          href={`/blog/category/${category}`}
          className={pillClass(active === category)}
        >
          {CATEGORY_LABELS[category]}{" "}
          <span className="ml-1 text-ink-muted">({count})</span>
        </Link>
      ))}
    </nav>
  )
}

function pillClass(isActive: boolean): string {
  const base =
    "inline-flex items-center rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors"
  if (isActive) {
    return `${base} border-moss bg-moss text-white`
  }
  return `${base} border-hairline bg-white text-ink hover:border-moss hover:text-[#6B8F71]`
}
