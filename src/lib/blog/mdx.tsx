import Image from "next/image"
import Link from "next/link"
import { MDXRemote, type MDXRemoteProps } from "next-mdx-remote/rsc"
import remarkGfm from "remark-gfm"
import rehypeSlug from "rehype-slug"
import rehypeAutolinkHeadings from "rehype-autolink-headings"

const components: MDXRemoteProps["components"] = {
  a: ({ href, children, ...rest }) => {
    const isInternal = href?.startsWith("/") || href?.startsWith("#")
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

export function MDXContent({ source }: { source: string }) {
  return (
    <MDXRemote
      source={source}
      components={components}
      options={{
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [
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
