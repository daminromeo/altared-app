import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import {
  getAllSlugs,
  getPostBySlug,
  getRelatedPosts,
} from "@/lib/blog/posts"
import { CATEGORY_LABELS } from "@/lib/blog/types"
import { MDXContent } from "@/lib/blog/mdx"
import { MarketingShell } from "@/components/blog/MarketingShell"
import { BlogCTA } from "@/components/blog/BlogCTA"
import { RelatedPosts } from "@/components/blog/RelatedPosts"
import { AuthorByline } from "@/components/blog/AuthorByline"
import {
  ArticleJsonLd,
  BreadcrumbJsonLd,
  FAQJsonLd,
} from "@/components/blog/JsonLd"

const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL ?? "https://altared.app"
).replace(/\/$/, "")

export const revalidate = 3600

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return { title: "Not found" }

  const url = `${SITE_URL}/blog/${post.slug}`
  const image = post.featuredImage
    ? `${SITE_URL}${post.featuredImage}`
    : `${SITE_URL}/og-image.png`

  return {
    title: `${post.title} | Altared`,
    description: post.description,
    keywords: post.keywords ?? post.tags,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      type: "article",
      publishedTime: new Date(post.publishedAt).toISOString(),
      modifiedTime: new Date(
        post.updatedAt ?? post.publishedAt
      ).toISOString(),
      authors: [post.author ?? "Altared Team"],
      images: [{ url: image, alt: post.featuredImageAlt ?? post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [image],
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const related = getRelatedPosts(post)
  const categoryLabel = CATEGORY_LABELS[post.category]

  return (
    <MarketingShell>
      <ArticleJsonLd post={post} />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Blog", url: "/blog" },
          {
            name: categoryLabel,
            url: `/blog/category/${post.category}`,
          },
          { name: post.title, url: `/blog/${post.slug}` },
        ]}
      />
      {post.faq && <FAQJsonLd faq={post.faq} />}

      <article className="mx-auto max-w-3xl px-6 py-12 md:py-16">
        <nav
          aria-label="Breadcrumb"
          className="mb-6 text-sm text-[#7A7A7A]"
        >
          <Link href="/" className="hover:text-[#2D2D2D]">
            Home
          </Link>{" "}
          /{" "}
          <Link href="/blog" className="hover:text-[#2D2D2D]">
            Blog
          </Link>{" "}
          /{" "}
          <Link
            href={`/blog/category/${post.category}`}
            className="hover:text-[#2D2D2D]"
          >
            {categoryLabel}
          </Link>
        </nav>

        <Link
          href={`/blog/category/${post.category}`}
          className="inline-flex items-center rounded-full bg-[#F0EDE8] px-3 py-1 text-xs font-medium text-[#6B8F71] hover:bg-[#E8E4DE]"
        >
          {categoryLabel}
        </Link>

        <h1
          className="mt-4 text-3xl font-bold leading-tight tracking-tight text-[#2D2D2D] md:text-4xl lg:text-5xl"
          style={{ fontFamily: "var(--font-playfair), serif" }}
        >
          {post.title}
        </h1>

        <p className="mt-4 text-lg leading-relaxed text-[#5A5A5A]">
          {post.description}
        </p>

        <AuthorByline
          author={post.author}
          publishedAt={post.publishedAt}
          readingMinutes={post.readingMinutes}
        />

        {post.featuredImage && (
          <div className="relative mx-auto mt-8 aspect-[4/5] w-full max-w-md overflow-hidden rounded-2xl border border-[#E8E4DE] bg-[#F0EDE8] sm:max-w-lg">
            <Image
              src={post.featuredImage}
              alt={post.featuredImageAlt ?? post.title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 512px"
            />
          </div>
        )}

        <div className="prose prose-neutral mt-10 max-w-none prose-headings:font-[var(--font-playfair),serif] prose-headings:tracking-tight prose-headings:text-[#2D2D2D] prose-p:text-[#3D3D3D] prose-p:leading-relaxed prose-a:text-[#6B8F71] prose-a:underline-offset-2 prose-strong:text-[#2D2D2D] prose-blockquote:border-l-[#8B9F82] prose-blockquote:bg-[#FAF8F5] prose-blockquote:py-2 prose-blockquote:not-italic prose-blockquote:text-[#3D3D3D] prose-li:text-[#3D3D3D] prose-img:rounded-xl">
          <MDXContent source={post.content} />
        </div>

        {post.faq && post.faq.length > 0 && (
          <section className="not-prose mt-12 border-t border-[#E8E4DE] pt-10">
            <h2
              className="mb-6 text-2xl font-semibold text-[#2D2D2D]"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              Frequently asked questions
            </h2>
            <dl className="space-y-6">
              {post.faq.map((q) => (
                <div key={q.question}>
                  <dt className="text-base font-semibold text-[#2D2D2D]">
                    {q.question}
                  </dt>
                  <dd className="mt-2 text-sm leading-relaxed text-[#3D3D3D]">
                    {q.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <BlogCTA />

        <RelatedPosts posts={related} />

        <footer className="mt-12 border-t border-[#E8E4DE] pt-6 text-sm text-[#7A7A7A]">
          Published{" "}
          {format(new Date(post.publishedAt), "MMMM d, yyyy")}
          {post.updatedAt && (
            <>
              {" "}· Updated {format(new Date(post.updatedAt), "MMMM d, yyyy")}
            </>
          )}
        </footer>
      </article>
    </MarketingShell>
  )
}
