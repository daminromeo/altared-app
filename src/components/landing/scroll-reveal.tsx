"use client"

import { useEffect } from "react"

/**
 * Plays the .reveal / .reveal-side entrance once per element as it scrolls
 * into view. Elements are only hidden once this has run (the `reveal-ready`
 * class), and nothing is hidden for visitors who prefer reduced motion.
 */
export function ScrollReveal() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const root = document.documentElement
    root.classList.add("reveal-ready")

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add("is-visible")
          observer.unobserve(entry.target)
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    )
    document.querySelectorAll(".reveal, .reveal-side").forEach((el) => observer.observe(el))

    return () => {
      observer.disconnect()
      root.classList.remove("reveal-ready")
    }
  }, [])

  return null
}
