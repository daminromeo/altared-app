import Link from "next/link"
import Image from "next/image"
import { format } from "date-fns"
import { CATEGORY_LABELS, type PostMeta } from "@/lib/blog/types"

export function PostCard({ post }: { post: PostMeta }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-[#E8E4DE] bg-white transition-shadow hover:shadow-lg">
      <Link href={`/blog/${post.slug}`} className="flex h-full flex-col">
        {post.featuredImage && (
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#F0EDE8]">
            <Image
              src={post.featuredImage}
              alt={post.featuredImageAlt ?? post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
        )}
        <div className="flex flex-1 flex-col p-6">
          <div className="mb-3 flex items-center gap-3 text-xs text-[#7A7A7A]">
            <span className="inline-flex items-center rounded-full bg-[#F0EDE8] px-2.5 py-1 font-medium text-[#6B8F71]">
              {CATEGORY_LABELS[post.category]}
            </span>
            <span>{format(new Date(post.publishedAt), "MMM d, yyyy")}</span>
            <span>·</span>
            <span>{post.readingMinutes} min read</span>
          </div>
          <h2
            className="mb-2 text-xl font-semibold leading-snug text-[#2D2D2D] group-hover:text-[#6B8F71]"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            {post.title}
          </h2>
          <p className="line-clamp-3 text-sm leading-relaxed text-[#5A5A5A]">
            {post.description}
          </p>
        </div>
      </Link>
    </article>
  )
}
