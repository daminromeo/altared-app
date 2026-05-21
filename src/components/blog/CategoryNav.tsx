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
        All <span className="ml-1 text-[#7A7A7A]">({totalCount})</span>
      </Link>
      {categories.map(({ category, count }) => (
        <Link
          key={category}
          href={`/blog/category/${category}`}
          className={pillClass(active === category)}
        >
          {CATEGORY_LABELS[category]}{" "}
          <span className="ml-1 text-[#7A7A7A]">({count})</span>
        </Link>
      ))}
    </nav>
  )
}

function pillClass(isActive: boolean): string {
  const base =
    "inline-flex items-center rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors"
  if (isActive) {
    return `${base} border-[#8B9F82] bg-[#8B9F82] text-white`
  }
  return `${base} border-[#E8E4DE] bg-white text-[#2D2D2D] hover:border-[#8B9F82] hover:text-[#6B8F71]`
}
