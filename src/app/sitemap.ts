import type { MetadataRoute } from "next"
import { getAllPosts, getAllCategories } from "@/lib/blog/posts"

// Regenerate hourly so dripped posts enter the sitemap without a redeploy,
// matching the ISR cadence of the blog routes (without this, the sitemap is
// statically frozen at build time and newly-published posts never appear).
export const revalidate = 3600

const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL ?? "https://altared.app"
).replace(/\/$/, "")

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, priority: 1, changeFrequency: "weekly" },
    { url: `${SITE_URL}/blog`, lastModified: now, priority: 0.9, changeFrequency: "daily" },
    { url: `${SITE_URL}/get-started`, lastModified: now, priority: 0.8, changeFrequency: "monthly" },
    { url: `${SITE_URL}/privacy`, lastModified: now, priority: 0.3, changeFrequency: "yearly" },
    { url: `${SITE_URL}/terms`, lastModified: now, priority: 0.3, changeFrequency: "yearly" },
  ]

  const posts: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt ?? post.publishedAt),
    changeFrequency: "monthly",
    priority: 0.7,
  }))

  const categories: MetadataRoute.Sitemap = getAllCategories().map(
    ({ category }) => ({
      url: `${SITE_URL}/blog/category/${category}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    })
  )

  return [...staticPages, ...posts, ...categories]
}
