import type { Post } from "@/lib/blog/types"

const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL ?? "https://altared.app"
).replace(/\/$/, "")

export function ArticleJsonLd({ post }: { post: Post }) {
  const url = `${SITE_URL}/blog/${post.slug}`
  const image = post.featuredImage
    ? `${SITE_URL}${post.featuredImage}`
    : `${SITE_URL}/og-image.png`

  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    image: [image],
    datePublished: new Date(post.publishedAt).toISOString(),
    dateModified: new Date(
      post.updatedAt ?? post.publishedAt
    ).toISOString(),
    author: {
      "@type": "Organization",
      name: post.author ?? "Altared Team",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "Altared",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/icon-512.png`,
      },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    keywords: (post.keywords ?? post.tags ?? []).join(", "),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; url: string }[]
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
    })),
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export function FAQJsonLd({
  faq,
}: {
  faq: { question: string; answer: string }[]
}) {
  if (!faq || faq.length === 0) return null
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: { "@type": "Answer", text: q.answer },
    })),
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
