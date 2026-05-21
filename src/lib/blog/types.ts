export type PostCategory =
  | "vendor-tips"
  | "hidden-costs"
  | "budgeting"
  | "planning"
  | "contracts"
  | "etiquette"
  | "trends"

export const CATEGORY_LABELS: Record<PostCategory, string> = {
  "vendor-tips": "Vendor Tips",
  "hidden-costs": "Hidden Costs",
  budgeting: "Budgeting",
  planning: "Planning",
  contracts: "Contracts",
  etiquette: "Etiquette",
  trends: "Trends",
}

export type PostFrontmatter = {
  title: string
  description: string
  publishedAt: string // ISO date — also gates visibility (future dates = scheduled)
  updatedAt?: string
  category: PostCategory
  tags?: string[]
  keywords?: string[]
  featuredImage?: string
  featuredImageAlt?: string
  author?: string
  faq?: { question: string; answer: string }[]
}

export type PostMeta = PostFrontmatter & {
  slug: string
  readingMinutes: number
}

export type Post = PostMeta & {
  content: string // raw MDX body
}
