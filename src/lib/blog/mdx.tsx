import Image from "next/image"
import Link from "next/link"
import { TrackedCTA } from "@/components/shared/tracked-cta"
import { MDXRemote, type MDXRemoteProps } from "next-mdx-remote/rsc"
import remarkGfm from "remark-gfm"
import rehypeSlug from "rehype-slug"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import type { Root, RootContent } from "hast"
import { InlineCTA } from "@/components/blog/InlineCTA"
import type { PostCategory } from "@/lib/blog/types"

const components: MDXRemoteProps["components"] = {
  a: ({ href, children, ...rest }) => {
    const isInternal = href?.startsWith("/") || href?.startsWith("#")
    // Sign-up links written into post bodies count toward the CTA funnel
    if (href?.startsWith("/get-started")) {
      return (
        <TrackedCTA
          href={href}
          location="blog_body_link"
          className="text-[#8B9F82] underline underline-offset-2 hover:text-[#6B8F71]"
          {...rest}
        >
          {children}
        </TrackedCTA>
      )
    }
    if (isInternal && href) {
      return (
        <Link
          href={href}
          className="text-[#8B9F82] underline underline-offset-2 hover:text-[#6B8F71]"
          {...rest}
        >
          {children}
        </Link>
      )
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#8B9F82] underline underline-offset-2 hover:text-[#6B8F71]"
        {...rest}
      >
        {children}
      </a>
    )
  },
  img: ({ src, alt, ...rest }) => {
    if (typeof src !== "string") return null
    return (
      <Image
        src={src}
        alt={alt ?? ""}
        width={1200}
        height={675}
        className="rounded-xl border border-[#E8E4DE]"
        {...rest}
      />
    )
  },
}

/**
 * Places <InlineCTA /> after a post's second section (before its third h2),
 * or after the first section when a post has only two. Readers stay up to a
 * couple of minutes, so the end-of-post CTA alone came too late.
 */
function rehypeInlineCta() {
  return (tree: Root) => {
    const h2Indexes = tree.children.flatMap((node, i) =>
      node.type === "element" && node.tagName === "h2" ? [i] : []
    )
    const at = h2Indexes[2] ?? h2Indexes[1]
    if (at === undefined) return
    tree.children.splice(at, 0, {
      type: "mdxJsxFlowElement",
      name: "InlineCTA",
      attributes: [],
      children: [],
    } as unknown as RootContent)
  }
}

export function MDXContent({ source, category }: { source: string; category: PostCategory }) {
  return (
    <MDXRemote
      source={source}
      components={{ ...components, InlineCTA: () => <InlineCTA category={category} /> }}
      options={{
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [
            rehypeInlineCta,
            rehypeSlug,
            [
              rehypeAutolinkHeadings,
              {
                behavior: "wrap",
                properties: { className: "no-underline" },
              },
            ],
          ],
        },
      }}
    />
  )
}
