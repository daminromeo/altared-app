// Sign-up prompts shown on blog posts, matched to what the reader came for.
// Each links to the landing page with ?from=<category> so its headline matches.

import type { PostCategory } from "./types"

export interface BlogCtaCopy {
  title: string
  accent: string
  body: string
  cta: string
  /** Short label for the sticky bar on phones */
  sticky: string
}

const DEFAULT_COPY: BlogCtaCopy = {
  title: "Planning the rest?",
  accent: "Keep vendors and budget in one place.",
  body: "Altared keeps your vendor quotes, budget and due dates together. It's free to start.",
  cta: "Get started free",
  sticky: "Keep your plan in one place",
}

const COPY: Partial<Record<PostCategory, BlogCtaCopy>> = {
  "hidden-costs": {
    title: "Got quotes like this?",
    accent: "See each vendor's full cost.",
    body: "Add your quotes to Altared with the extras from this post, then compare vendors side by side. It's free to start.",
    cta: "Add your vendor quotes free",
    sticky: "Compare your vendor quotes",
  },
  contracts: {
    title: "Signed, or about to?",
    accent: "Keep every due date in one place.",
    body: "Add each vendor's deposit and payment dates to Altared and see what's due next. It's free to start.",
    cta: "Track your vendor payments free",
    sticky: "Track your vendor payments",
  },
  budgeting: {
    title: "Working on the numbers?",
    accent: "Keep your budget in one place.",
    body: "Set your budget, add vendors as you book them, and see what's left in each category. It's free to start.",
    cta: "Start your wedding budget free",
    sticky: "Start your wedding budget",
  },
  "vendor-tips": {
    title: "Comparing vendors?",
    accent: "Line them up side by side.",
    body: "Add your quotes and compare vendors on price and what's included, then share the shortlist with your partner. It's free to start.",
    cta: "Compare your vendors free",
    sticky: "Compare your vendors",
  },
}

export function blogCtaCopy(category: PostCategory): BlogCtaCopy {
  return COPY[category] ?? DEFAULT_COPY
}

export function blogCtaHref(category: PostCategory): string {
  return `/get-started?from=${category}`
}
