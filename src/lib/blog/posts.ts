import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"
import readingTime from "reading-time"
import type { Post, PostFrontmatter, PostMeta, PostCategory } from "./types"

const POSTS_DIR = path.join(process.cwd(), "src", "content", "blog")

function readAllRaw(): Post[] {
  if (!fs.existsSync(POSTS_DIR)) return []
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".mdx"))
  return files.map((file) => {
    const slug = file.replace(/\.mdx$/, "")
    const full = path.join(POSTS_DIR, file)
    const raw = fs.readFileSync(full, "utf8")
    const { data, content } = matter(raw)
    const fm = data as PostFrontmatter
    return {
      slug,
      content,
      readingMinutes: Math.max(1, Math.round(readingTime(content).minutes)),
      ...fm,
    }
  })
}

function isPublished(post: Pick<Post, "publishedAt">): boolean {
  return new Date(post.publishedAt).getTime() <= Date.now()
}

export function getAllPosts(): PostMeta[] {
  return readAllRaw()
    .filter(isPublished)
    .map(({ content: _content, ...meta }) => meta)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
}

export function getPostBySlug(slug: string): Post | null {
  const raw = readAllRaw().find((p) => p.slug === slug)
  if (!raw || !isPublished(raw)) return null
  return raw
}

export function getPostsByCategory(category: PostCategory): PostMeta[] {
  return getAllPosts().filter((p) => p.category === category)
}

export function getAllCategories(): { category: PostCategory; count: number }[] {
  const counts = new Map<PostCategory, number>()
  for (const p of getAllPosts()) {
    counts.set(p.category, (counts.get(p.category) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
}

export function getRelatedPosts(
  post: PostMeta,
  limit = 3
): PostMeta[] {
  const all = getAllPosts().filter((p) => p.slug !== post.slug)
  const sameCategory = all.filter((p) => p.category === post.category)
  const others = all.filter((p) => p.category !== post.category)
  return [...sameCategory, ...others].slice(0, limit)
}

export function getAllSlugs(): string[] {
  return getAllPosts().map((p) => p.slug)
}
