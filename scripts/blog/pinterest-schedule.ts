#!/usr/bin/env tsx
/**
 * blog:pinterest-schedule — generate Pinterest pins from published blog posts
 * and schedule them via the Postiz public API.
 *
 * For each PUBLISHED post it builds one pin:
 *   - image: public/blog/<slug>.jpg (uploaded to Postiz from its live URL)
 *   - title: the post title (<=100 chars)
 *   - description: the post's meta description (keyword-rich)
 *   - link: https://altared.app/blog/<slug>  ← the SEO destination link
 *   - board: routed by vendor tag first, then category (see routeBoard)
 *
 * SAFE BY DEFAULT: dry-run unless --execute is passed. With --execute it creates
 * posts of --type (default "draft" so nothing auto-publishes until you review in
 * Postiz; use --type schedule to actually queue them).
 *
 * Usage:
 *   npm run blog:pinterest-schedule                      # dry-run: print routing for all published posts
 *   npm run blog:pinterest-schedule -- --only dj-all-inclusive-add-ons   # single post
 *   npm run blog:pinterest-schedule -- --only <slug> --execute --type draft   # create ONE draft pin to review
 *   npm run blog:pinterest-schedule -- --execute --type schedule --start 2026-06-30T09:00 --per-day 5
 *
 * Options:
 *   --execute            Actually call the Postiz API (otherwise dry-run)
 *   --type <t>           draft | schedule | now   (default: draft)
 *   --start <iso>        First scheduled pin time (local). Default: tomorrow 9am
 *   --per-day <n>        Pins per day when scheduling (default: 5)
 *   --only <slug>        Only this post
 *   --limit <n>          Only the first N posts
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import matter from "gray-matter"
import dotenv from "dotenv"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, "..", "..")
const POSTS_DIR = path.join(ROOT, "src", "content", "blog")
const PUBLIC_BLOG = path.join(ROOT, "public", "blog")

dotenv.config({ path: path.join(ROOT, ".env.local") })

const API_BASE = "https://api.postiz.com/public/v1"
const SITE = "https://altared.app"
const PINTEREST_INTEGRATION_ID = "cmqzfv34k021qk00y6gny1p17" // altaredapp

// Board ids fetched via integration-trigger { methodName: "boards" }.
const BOARDS = {
  hiddenCosts: "1108870808192966717", // Hidden Wedding Costs & Fees
  vendors: "1108870808192966726", // How to Choose Wedding Vendors
  budget: "1108870808192966722", // Wedding Budget Tips
  catering: "1108870808192966729", // Wedding Catering & Bar Costs
  photoFlowers: "1108870808192966732", // Wedding Photography & Flowers
  contracts: "1108870808192966720", // Wedding Vendor Contracts & Red Flags
  venue: "1108870808192966727", // Wedding Venue Tips & Costs
}
const BOARD_NAMES: Record<string, string> = {
  [BOARDS.hiddenCosts]: "Hidden Wedding Costs & Fees",
  [BOARDS.vendors]: "How to Choose Wedding Vendors",
  [BOARDS.budget]: "Wedding Budget Tips",
  [BOARDS.catering]: "Wedding Catering & Bar Costs",
  [BOARDS.photoFlowers]: "Wedding Photography & Flowers",
  [BOARDS.contracts]: "Wedding Vendor Contracts & Red Flags",
  [BOARDS.venue]: "Wedding Venue Tips & Costs",
}

type Post = {
  slug: string
  title: string
  description: string
  category: string
  tags: string[]
  publishedAt: string
}

type Args = {
  execute: boolean
  type: "draft" | "schedule" | "now"
  start: Date
  perDay: number
  only?: string
  limit?: number
}

function die(msg: string): never {
  console.error(`error: ${msg}`)
  process.exit(1)
}

function parseArgs(argv: string[]): Args {
  const a: Args = {
    execute: false,
    type: "draft",
    start: tomorrow9am(),
    perDay: 5,
  }
  for (let i = 0; i < argv.length; i++) {
    const f = argv[i]
    if (f === "--execute") a.execute = true
    else if (f === "--type") {
      const v = argv[++i]
      if (!["draft", "schedule", "now"].includes(v)) die(`bad --type: ${v}`)
      a.type = v as Args["type"]
    } else if (f === "--start") {
      const d = new Date(argv[++i])
      if (Number.isNaN(d.getTime())) die("bad --start")
      a.start = d
    } else if (f === "--per-day") a.perDay = Number(argv[++i])
    else if (f === "--only") a.only = argv[++i]
    else if (f === "--limit") a.limit = Number(argv[++i])
    else if (f === "--help" || f === "-h") {
      console.log("See header comment for usage.")
      process.exit(0)
    } else die(`unknown flag: ${f}`)
  }
  return a
}

function tomorrow9am(): Date {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(9, 0, 0, 0)
  return d
}

function publishedPosts(): Post[] {
  const now = Date.now()
  const out: Post[] = []
  for (const file of fs.readdirSync(POSTS_DIR)) {
    if (!file.endsWith(".mdx")) continue
    const { data } = matter(fs.readFileSync(path.join(POSTS_DIR, file), "utf8"))
    const pa = data.publishedAt ? new Date(data.publishedAt).getTime() : NaN
    if (Number.isNaN(pa) || pa > now) continue
    out.push({
      slug: file.replace(/\.mdx$/, ""),
      title: String(data.title ?? ""),
      description: String(data.description ?? ""),
      category: String(data.category ?? ""),
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      publishedAt: new Date(pa).toISOString(),
    })
  }
  // Oldest first, so the backlog drips out in publish order.
  return out.sort((x, y) => x.publishedAt.localeCompare(y.publishedAt))
}

// Vendor tag first, then category. Returns a board id.
function routeBoard(post: Post): string {
  const t = post.tags.map((s) => s.toLowerCase()).join(" ")
  const has = (...words: string[]) => words.some((w) => t.includes(w))

  if (has("venue")) return BOARDS.venue
  if (has("catering", "bar", "service charge", "per plate", "caterer"))
    return BOARDS.catering
  if (has("photograph", "florist", "flower", "floral"))
    return BOARDS.photoFlowers

  switch (post.category) {
    case "contracts":
      return BOARDS.contracts
    case "budgeting":
      return BOARDS.budget
    case "vendor-tips":
      return BOARDS.vendors
    default:
      return BOARDS.hiddenCosts // hidden-costs + anything else
  }
}

function pinFor(post: Post) {
  return {
    title: post.title.slice(0, 100),
    description: post.description,
    link: `${SITE}/blog/${post.slug}`,
    board: routeBoard(post),
    imageUrl: `${SITE}/blog/${post.slug}.jpg`,
    imageFile: path.join(PUBLIC_BLOG, `${post.slug}.jpg`),
  }
}

function apiKey(): string {
  const k = process.env.POSTIZ_API_KEY
  if (!k) die("POSTIZ_API_KEY not set in .env.local")
  return k
}

async function uploadFromUrl(url: string): Promise<{ id: string; path: string }> {
  const res = await fetch(`${API_BASE}/upload-from-url`, {
    method: "POST",
    headers: { Authorization: apiKey(), "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  })
  if (!res.ok) throw new Error(`upload-from-url ${res.status}: ${await res.text()}`)
  const j = (await res.json()) as { id: string; path: string }
  if (!j.id || !j.path) throw new Error(`upload returned no id/path: ${JSON.stringify(j)}`)
  return j
}

async function createPin(
  post: Post,
  when: Date,
  type: Args["type"]
): Promise<string> {
  const pin = pinFor(post)
  const media = await uploadFromUrl(pin.imageUrl)
  const body = {
    type,
    date: when.toISOString(),
    shortLink: false,
    tags: [],
    posts: [
      {
        integration: { id: PINTEREST_INTEGRATION_ID },
        value: [{ content: pin.description, image: [media] }],
        settings: {
          __type: "pinterest",
          title: pin.title,
          link: pin.link,
          board: pin.board,
        },
      },
    ],
  }
  const res = await fetch(`${API_BASE}/posts`, {
    method: "POST",
    headers: { Authorization: apiKey(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`POST /posts ${res.status}: ${await res.text()}`)
  const j = (await res.json()) as any
  return j?.[0]?.id ?? j?.id ?? "(created)"
}

// nth pin's scheduled time: perDay pins spread 09:00..21:00 each day from start.
function scheduleTime(start: Date, index: number, perDay: number): Date {
  const day = Math.floor(index / perDay)
  const slot = index % perDay
  const d = new Date(start)
  d.setDate(d.getDate() + day)
  const spanHours = 12 // 9am..9pm
  const hour = 9 + Math.round((slot * spanHours) / Math.max(1, perDay))
  d.setHours(hour, 0, 0, 0)
  return d
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  let posts = publishedPosts()
  if (args.only) {
    posts = posts.filter((p) => p.slug === args.only)
    if (posts.length === 0) die(`no published post with slug: ${args.only}`)
  }
  if (args.limit) posts = posts.slice(0, args.limit)

  // Posts missing a pin image (e.g. no slideshow) are skipped with a warning.
  const skipped = posts.filter((p) => !fs.existsSync(pinFor(p).imageFile))
  posts = posts.filter((p) => fs.existsSync(pinFor(p).imageFile))

  console.log(
    `${posts.length} pins to ${args.execute ? `create (type=${args.type})` : "preview (dry-run)"}` +
      (skipped.length ? `  |  ${skipped.length} skipped (no image)` : "")
  )
  console.log("")

  const byBoard = new Map<string, number>()
  for (let i = 0; i < posts.length; i++) {
    const p = posts[i]
    const pin = pinFor(p)
    const when = scheduleTime(args.start, i, args.perDay)
    byBoard.set(pin.board, (byBoard.get(pin.board) ?? 0) + 1)

    if (!args.execute) {
      console.log(
        `• ${p.slug}\n    → ${BOARD_NAMES[pin.board]}  |  ${args.type === "draft" ? "draft" : when.toISOString()}\n    ${pin.link}`
      )
      continue
    }
    try {
      const id = await createPin(p, when, args.type)
      console.log(`✓ ${p.slug} → ${BOARD_NAMES[pin.board]}  (${args.type}, id=${id})`)
    } catch (err) {
      console.error(`✗ ${p.slug}: ${err instanceof Error ? err.message : err}`)
    }
  }

  console.log("\n— board distribution —")
  for (const [b, n] of [...byBoard.entries()].sort((a, z) => z[1] - a[1])) {
    console.log(`  ${n.toString().padStart(3)}  ${BOARD_NAMES[b]}`)
  }
  if (skipped.length) {
    console.log(`\nSkipped (no public/blog/<slug>.jpg): ${skipped.map((p) => p.slug).join(", ")}`)
  }
  if (!args.execute) {
    console.log(`\nDry-run only. Add --execute (and --type draft for a safe first pass) to create pins.`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
