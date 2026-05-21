"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { CATEGORY_LABELS, type PostMeta } from "@/lib/blog/types"
import { PostCard } from "./PostCard"

type Props = {
  posts: PostMeta[]
}

export function SearchableGrid({ posts }: Props) {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return posts
    return posts.filter((p) => {
      const haystack = [
        p.title,
        p.description,
        CATEGORY_LABELS[p.category],
        ...(p.tags ?? []),
        ...(p.keywords ?? []),
      ]
        .join(" ")
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [posts, query])

  return (
    <>
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search wedding tips, vendors, budgets…"
          className="w-full rounded-xl border border-[#E8E4DE] bg-white px-4 py-3 pl-11 text-sm text-[#2D2D2D] placeholder:text-[#9A9A9A] focus:border-[#8B9F82] focus:outline-none focus:ring-2 focus:ring-[#8B9F82]/20"
          aria-label="Search blog posts"
        />
        <svg
          aria-hidden
          className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9A9A9A]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
          />
        </svg>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#E8E4DE] bg-white p-12 text-center">
          <p className="text-sm text-[#7A7A7A]">
            No posts match &ldquo;{query}&rdquo;. Try a different search.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <PostCard key={p.slug} post={p} />
          ))}
        </div>
      )}

      <p className="text-xs text-[#9A9A9A]">
        Showing {filtered.length} of {posts.length} posts
        {query && (
          <>
            {" "}· last published{" "}
            {format(new Date(posts[0]?.publishedAt ?? Date.now()), "MMM d, yyyy")}
          </>
        )}
      </p>
    </>
  )
}
