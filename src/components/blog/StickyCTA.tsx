"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { TrackedCTA } from "@/components/shared/tracked-cta"
import { blogCtaCopy, blogCtaHref } from "@/lib/blog/blog-ctas"
import type { PostCategory } from "@/lib/blog/types"

const DISMISSED_KEY = "altared_blog_sticky_dismissed"
/** Share of the article read before the bar appears */
const SHOW_AT = 0.4

/**
 * Slim sign-up bar on phones once a reader is 40% through the post. Shows at
 * most once per session and can be dismissed.
 */
export function StickyCTA({ category }: { category: PostCategory }) {
  const [visible, setVisible] = useState(false)
  const copy = blogCtaCopy(category)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISSED_KEY)) return
    } catch {
      // storage blocked: still show the bar
    }

    const article = document.querySelector("article")
    function onScroll() {
      if (!article) return
      const rect = article.getBoundingClientRect()
      const read = (window.innerHeight - rect.top) / rect.height
      if (read >= SHOW_AT) {
        setVisible(true)
        window.removeEventListener("scroll", onScroll)
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  function dismiss() {
    setVisible(false)
    try {
      sessionStorage.setItem(DISMISSED_KEY, "1")
    } catch {
      // ignore
    }
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <div className="flex items-center gap-3 rounded-2xl bg-ink py-2.5 pl-4 pr-2.5 text-white shadow-2xl motion-safe:animate-in motion-safe:slide-in-from-bottom-4">
        <div className="min-w-0 flex-1 text-sm leading-tight">
          <p className="font-semibold">{copy.sticky}</p>
          <p className="text-xs text-white/65">Free to start · no card</p>
        </div>
        <TrackedCTA
          href={blogCtaHref(category)}
          location="blog_sticky"
          className="shrink-0 rounded-full bg-champagne px-4 py-2 font-display text-sm font-bold text-ink"
        >
          Start
        </TrackedCTA>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-white/60 hover:text-white"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
