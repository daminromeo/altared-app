#!/usr/bin/env tsx
/**
 * Drafts wedding blog posts from your TikTok/IG slideshow folders.
 *
 * Each slideshow folder under /slideshows/<week>/<slug>/ has:
 *   - caption.md   (Hook, TikTok caption, Instagram caption)
 *   - config.json  (slide-by-slide text)
 *
 * Usage:
 *   npm run blog:draft -- --from-week week-20
 *   npm run blog:draft -- --from-slideshow slideshows/week-20/01_vendor_question_exposes_hidden
 *   npm run blog:draft -- "Raw hook line"                            # ad-hoc, no slideshow
 *   npm run blog:draft -- --from-week week-20 --start 2026-05-22T09:00
 *   npm run blog:draft -- --from-slideshow <path> --dry-run
 *
 * Batches drip-schedule 12h apart (2/day) from --start (default: tomorrow 9am).
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import dotenv from "dotenv"
import Anthropic from "@anthropic-ai/sdk"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, "..", "..")
const POSTS_DIR = path.join(ROOT, "src", "content", "blog")
const SLIDESHOWS_DIR = path.join(ROOT, "slideshows")

dotenv.config({ path: path.join(ROOT, ".env.local") })

const VALID_CATEGORIES = [
  "vendor-tips",
  "hidden-costs",
  "budgeting",
  "planning",
  "contracts",
  "etiquette",
  "trends",
] as const
type Category = (typeof VALID_CATEGORIES)[number]

type SourceItem =
  | { kind: "hook"; hook: string; suggestedSlug?: string }
  | {
      kind: "slideshow"
      folder: string // absolute path
      folderName: string // e.g. "01_vendor_question_exposes_hidden"
      hook: string
      tiktokCaption: string
      instagramCaption: string
      slideText: string // flattened slide text
    }

type Args = {
  sources: SourceItem[]
  category?: Category
  start?: Date
  model: string
  dryRun: boolean
  overwrite: boolean
}

const USAGE = `Usage:
  npm run blog:draft -- --from-week week-20
  npm run blog:draft -- --from-slideshow slideshows/week-20/01_vendor_question_exposes_hidden
  npm run blog:draft -- "<raw hook line>"

Options:
  --from-week <name>       Batch all slideshow folders in slideshows/<name>
  --from-slideshow <path>  Single slideshow folder (relative or absolute)
  --category <slug>        Force category. One of: ${VALID_CATEGORIES.join(", ")}
  --start <iso>            First publish time (default: tomorrow 9am local)
                           Subsequent posts drip 12h later (2/day)
  --model <id>             Anthropic model (default: claude-opus-4-8)
  --overwrite              Overwrite existing MDX files (default: skip)
  --dry-run                Print MDX to stdout instead of writing files`

function die(msg: string): never {
  console.error(`error: ${msg}`)
  process.exit(1)
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    sources: [],
    model: "claude-opus-4-8",
    dryRun: false,
    overwrite: false,
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === "--category") {
      const v = argv[++i]
      if (!VALID_CATEGORIES.includes(v as Category)) {
        die(`Invalid category: ${v}. Valid: ${VALID_CATEGORIES.join(", ")}`)
      }
      args.category = v as Category
    } else if (a === "--start") {
      const v = argv[++i]
      const d = new Date(v)
      if (Number.isNaN(d.getTime())) die(`Invalid --start date: ${v}`)
      args.start = d
    } else if (a === "--from-week") {
      const week = argv[++i]
      args.sources.push(...loadWeek(week))
    } else if (a === "--from-slideshow") {
      args.sources.push(loadSlideshow(argv[++i]))
    } else if (a === "--model") {
      args.model = argv[++i]
    } else if (a === "--dry-run") {
      args.dryRun = true
    } else if (a === "--overwrite") {
      args.overwrite = true
    } else if (a === "--help" || a === "-h") {
      console.log(USAGE)
      process.exit(0)
    } else if (a.startsWith("--")) {
      die(`Unknown flag: ${a}`)
    } else {
      args.sources.push({ kind: "hook", hook: a })
    }
  }
  return args
}

function loadWeek(weekName: string): SourceItem[] {
  const weekDir = path.isAbsolute(weekName)
    ? weekName
    : path.join(SLIDESHOWS_DIR, weekName)
  if (!fs.existsSync(weekDir)) die(`Week folder not found: ${weekDir}`)
  const folders = fs
    .readdirSync(weekDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => !name.startsWith("."))
    .sort() // numeric prefix gives natural order
  if (folders.length === 0) die(`No slideshow folders in ${weekDir}`)
  return folders.map((name) => loadSlideshow(path.join(weekDir, name)))
}

function loadSlideshow(folderArg: string): SourceItem {
  const folder = path.isAbsolute(folderArg)
    ? folderArg
    : path.join(ROOT, folderArg)
  if (!fs.existsSync(folder)) die(`Slideshow folder not found: ${folder}`)

  const captionPath = path.join(folder, "caption.md")
  const configPath = path.join(folder, "config.json")
  if (!fs.existsSync(captionPath)) die(`Missing caption.md in ${folder}`)
  if (!fs.existsSync(configPath)) die(`Missing config.json in ${folder}`)

  const caption = fs.readFileSync(captionPath, "utf8")
  const config = JSON.parse(fs.readFileSync(configPath, "utf8")) as Array<{
    lines?: Array<{ text?: string }>
  }>

  const hook = extractSection(caption, "Hook") ?? ""
  const tiktokCaption = extractSection(caption, "TikTok caption") ?? ""
  const instagramCaption = extractSection(caption, "Instagram caption") ?? ""

  const slideText = config
    .map((slide, i) => {
      const lines = (slide.lines ?? [])
        .map((l) => (l.text ?? "").trim())
        .filter(Boolean)
      return `Slide ${i + 1}:\n${lines.map((l) => `  - ${l}`).join("\n")}`
    })
    .join("\n\n")

  if (!hook) die(`No "Hook" section in ${captionPath}`)

  return {
    kind: "slideshow",
    folder,
    folderName: path.basename(folder),
    hook,
    tiktokCaption,
    instagramCaption,
    slideText,
  }
}

// Pulls the body under "## <heading>" up to the next "## " heading.
function extractSection(md: string, heading: string): string | undefined {
  const lines = md.split("\n")
  const target = `## ${heading}`
  const start = lines.findIndex((l) => l.trim() === target)
  if (start === -1) return undefined
  let end = lines.length
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].startsWith("## ")) {
      end = i
      break
    }
  }
  const body = lines.slice(start + 1, end).join("\n").trim()
  return body || undefined
}

function tomorrowAt9amLocal(): Date {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(9, 0, 0, 0)
  return d
}

function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)
}

// Folder name like "01_vendor_question_exposes_hidden" → "vendor-question-exposes-hidden"
function slugFromFolderName(name: string): string {
  return name.replace(/^\d+_/, "").replace(/_/g, "-")
}

type DraftedPost = {
  title: string
  description: string
  category: Category
  tags: string[]
  keywords: string[]
  body: string
  faq: { question: string; answer: string }[]
}

const SYSTEM_PROMPT = `You are an SEO content writer for Altared, a wedding planning app. You write practical, specific, honest blog posts for engaged couples — the opposite of fluffy listicles. Your voice is warm, knowledgeable, direct, and confidently lowercase-conversational where the brand uses it. You never invent vendor names or stats. When you reference a number, it should match (or be consistent with) the dollar ranges already in the source material.

Your job: expand a hook + source material (TikTok/IG slideshow content) into a 1,200–1,800 word blog post. Submit it via the submit_post tool — never reply with plain text.

Hard requirements for the body:
- Open with a concrete scene or specific example. NEVER "Planning a wedding is exciting but..." or "Let's dive in"
- 3–6 H2 sections (## ), with H3 subheads where useful. DO NOT include a top-level H1, it is rendered from the title
- Include at least one numbered list AND at least one specific dollar example, drawing from the source material's dollar figures verbatim where possible
- Include a "red flags" or "watch for" beat
- Close with a short, actionable summary list
- Internal-link naturally to /blog/category/{slug} or /get-started where it helps the reader. Do not stuff links
- Reuse the exact phrases and dollar amounts from the source material when relevant. This keeps brand voice consistent
- No AI tells ("in today's world", "let's dive in", "the bottom line is")
- Avoid em-dashes; use commas, periods, or parentheses instead`

const POST_TOOL: Anthropic.Tool = {
  name: "submit_post",
  description: "Submit the drafted blog post with all required fields.",
  input_schema: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "Click-worthy but not clickbait. 50–70 characters.",
      },
      description: {
        type: "string",
        description:
          "Meta description, 150–160 characters, naturally includes the primary keyword.",
      },
      category: {
        type: "string",
        enum: [...VALID_CATEGORIES],
      },
      tags: {
        type: "array",
        items: { type: "string" },
        description: "3–6 short topic tags, lowercase.",
      },
      keywords: {
        type: "array",
        items: { type: "string" },
        description:
          "8–12 SEO keywords/phrases, lowercase, including long-tails. Extract relevant ones from the TikTok caption hashtags.",
      },
      body: {
        type: "string",
        description:
          "MDX markdown content (1,200–1,800 words). No H1. No frontmatter.",
      },
      faq: {
        type: "array",
        items: {
          type: "object",
          properties: {
            question: { type: "string" },
            answer: {
              type: "string",
              description: "60–120 words.",
            },
          },
          required: ["question", "answer"],
        },
        description: "3–5 FAQs.",
      },
    },
    required: [
      "title",
      "description",
      "category",
      "tags",
      "keywords",
      "body",
      "faq",
    ],
  },
}

function userPrompt(item: SourceItem, forced: Category | undefined): string {
  const categoryHint = forced
    ? `Use category: "${forced}".`
    : "Choose the most appropriate category."

  if (item.kind === "hook") {
    return `Hook: "${item.hook}"\n\nWrite a blog post expanding this hook. ${categoryHint}`
  }

  return [
    `Hook: ${item.hook}`,
    "",
    "TikTok caption:",
    item.tiktokCaption,
    "",
    "Instagram caption (this is the brand-voice backbone — match its tone, reuse its dollar figures and phrasing):",
    item.instagramCaption,
    "",
    "Slide-by-slide text (use this as the structural skeleton — each slide is a beat that should map roughly to a section or sub-point):",
    item.slideText,
    "",
    `Write a 1,200–1,800 word blog post expanding this material into long-form. ${categoryHint}`,
  ].join("\n")
}

async function draftPost(
  client: Anthropic,
  item: SourceItem,
  forcedCategory: Category | undefined,
  model: string
): Promise<DraftedPost> {
  const resp = await client.messages.create({
    model,
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    tools: [POST_TOOL],
    tool_choice: { type: "tool", name: "submit_post" },
    messages: [{ role: "user", content: userPrompt(item, forcedCategory) }],
  })

  const toolUse = resp.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
  )
  if (!toolUse) {
    throw new Error(
      `Model did not invoke submit_post tool. stop_reason=${resp.stop_reason}`
    )
  }

  const parsed = toolUse.input as DraftedPost
  if (
    !parsed.title ||
    !parsed.description ||
    !parsed.body ||
    !parsed.category ||
    !VALID_CATEGORIES.includes(parsed.category)
  ) {
    throw new Error(
      `Invalid draft fields: ${JSON.stringify({
        title: parsed.title,
        category: parsed.category,
      })}`
    )
  }

  return parsed
}

function toMdx(post: DraftedPost, publishedAt: Date): string {
  const fm = [
    "---",
    `title: ${yamlStr(post.title)}`,
    `description: ${yamlStr(post.description)}`,
    `publishedAt: ${publishedAt.toISOString()}`,
    `category: ${post.category}`,
    `author: Altared Team`,
    `tags:${yamlList(post.tags)}`,
    `keywords:${yamlList(post.keywords)}`,
  ]
  if (post.faq?.length) {
    fm.push("faq:")
    for (const q of post.faq) {
      fm.push(`  - question: ${yamlStr(q.question)}`)
      fm.push(`    answer: ${yamlStr(q.answer)}`)
    }
  }
  fm.push("---", "")
  return `${fm.join("\n")}\n${post.body.trim()}\n`
}

function yamlStr(s: string): string {
  return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`
}

function yamlList(items: unknown): string {
  if (items === undefined || items === null) return " []"
  const arr = Array.isArray(items) ? items : [items]
  const stringified = arr
    .map((t) => (typeof t === "string" ? t : String(t)))
    .filter((t) => t.length > 0)
  if (stringified.length === 0) return " []"
  return "\n" + stringified.map((t) => `  - ${yamlStr(t)}`).join("\n")
}

function shouldWrite(filePath: string, overwrite: boolean): boolean {
  if (!fs.existsSync(filePath)) return true
  if (overwrite) return true
  return false
}

function pickSlug(item: SourceItem, draftedTitle: string): string {
  if (item.kind === "slideshow") return slugFromFolderName(item.folderName)
  return slugifyTitle(draftedTitle)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.sources.length === 0) {
    console.error(USAGE)
    process.exit(1)
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    die("ANTHROPIC_API_KEY is not set (check .env.local)")
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  if (!args.dryRun && !fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true })
  }

  const start = args.start ?? tomorrowAt9amLocal()
  const SCHEDULE_STEP_MS = 12 * 60 * 60 * 1000

  for (let i = 0; i < args.sources.length; i++) {
    const item = args.sources[i]
    const publishedAt = new Date(start.getTime() + i * SCHEDULE_STEP_MS)
    const label =
      item.kind === "slideshow" ? item.folderName : `"${item.hook}"`

    // For slideshows, the slug is deterministic from folder name, so we can
    // skip API calls when the file already exists and --overwrite is not set.
    if (!args.dryRun && item.kind === "slideshow") {
      const predictedSlug = slugFromFolderName(item.folderName)
      const predictedPath = path.join(POSTS_DIR, `${predictedSlug}.mdx`)
      if (!shouldWrite(predictedPath, args.overwrite)) {
        console.log(
          `\n[${i + 1}/${args.sources.length}] ${label}  →  exists, skipping (use --overwrite to replace)`
        )
        continue
      }
    }

    console.log(
      `\n[${i + 1}/${args.sources.length}] Drafting: ${label}  →  publish ${publishedAt.toISOString()}`
    )

    let post: DraftedPost
    try {
      post = await draftPost(client, item, args.category, args.model)
    } catch (err) {
      console.error(`  ✗ Failed: ${err instanceof Error ? err.message : err}`)
      continue
    }

    try {
      const slug = pickSlug(item, post.title)
      const outPath = path.join(POSTS_DIR, `${slug}.mdx`)
      const mdx = toMdx(post, publishedAt)

      if (args.dryRun) {
        console.log(`  (dry-run) would write: ${outPath}`)
        console.log("─".repeat(60))
        console.log(mdx)
        console.log("─".repeat(60))
        continue
      }

      if (!shouldWrite(outPath, args.overwrite)) {
        console.log(`  → exists, skipping (use --overwrite to replace)`)
        continue
      }

      fs.writeFileSync(outPath, mdx, "utf8")
      console.log(
        `  ✓ Wrote ${path.relative(ROOT, outPath)} (${post.category}, ${
          post.body.split(/\s+/).length
        } words)`
      )
    } catch (err) {
      console.error(
        `  ✗ Write failed: ${err instanceof Error ? err.message : err}`
      )
    }
  }

  console.log(
    args.dryRun
      ? "\nDone (dry-run)."
      : `\nDone. Review the MDX files in ${path.relative(ROOT, POSTS_DIR)} and commit.`
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
