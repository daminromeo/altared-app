import Image from "next/image"

// Product illustrations for the landing page, drawn in HTML so they stay crisp
// and match the app. Names and figures are illustrative. The app's screens
// lead; texts appear as accents beside them, showing what was texted landing
// in the plan.

const CARD =
  "rounded-3xl border border-black/5 bg-white text-ink shadow-[0_30px_60px_-30px_rgba(11,16,13,0.45)]"

// The phone's own message colours, so texts read as texts at a glance
const SENT = "bg-[#0A84FF] text-white"
const RECEIVED = "bg-[#E9E9EB] text-[#111]"

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-muted">{children}</span>
  )
}

/** Marks the thing that arrived by text. */
function FromText() {
  return (
    <span className="inline-flex flex-none items-center gap-1 whitespace-nowrap rounded-full bg-[#0A84FF]/10 px-1.5 py-0.5 text-[9.5px] font-bold text-[#0A6FD6]">
      <svg viewBox="0 0 16 16" className="size-2.5" aria-hidden>
        <path
          fill="currentColor"
          d="M8 1C3.6 1 0 3.9 0 7.5c0 1.9 1 3.6 2.6 4.8L2 15l3.3-1.8c.9.2 1.8.3 2.7.3 4.4 0 8-2.9 8-6.5S12.4 1 8 1Z"
        />
      </svg>
      From your text
    </span>
  )
}

// ── Texts ────────────────────────────────────────────────────────────────────

export type ThreadMessage =
  | { from: "couple" | "planner"; text: string }
  | { from: "couple"; photo: string }

/** A photo of a quote, as it looks inside a text bubble. */
function QuotePhoto({ name }: { name: string }) {
  return (
    <span className="block w-32 self-end overflow-hidden rounded-2xl rounded-br-md border border-black/10 bg-white p-2.5">
      <span className="block text-[9px] font-bold uppercase tracking-[0.08em] text-ink-muted">{name}</span>
      <span className="mt-2 block space-y-1.5" aria-hidden>
        {[90, 70, 80, 55].map((w) => (
          <span key={w} className="block h-1.5 rounded-full bg-ink/10" style={{ width: `${w}%` }} />
        ))}
        <span className="flex justify-between pt-1">
          <span className="block h-1.5 w-10 rounded-full bg-ink/25" />
          <span className="block h-1.5 w-8 rounded-full bg-ink/25" />
        </span>
      </span>
    </span>
  )
}

/** A short text conversation with the planner. */
export function TextThread({
  messages,
  bare = false,
  className = "",
}: {
  messages: ThreadMessage[]
  /** No card around it, for inside the phone frame */
  bare?: boolean
  className?: string
}) {
  return (
    <div
      className={`flex w-full flex-col gap-2 leading-snug ${
        bare ? "" : `${CARD} max-w-sm p-4 text-[13.5px]`
      } ${className}`}
    >
      {!bare && (
        <div className="mb-1 flex items-center justify-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-full bg-moss font-display text-[11px] font-bold text-white">
            A
          </span>
          <span className="text-xs font-semibold text-ink-muted">Altared planner</span>
        </div>
      )}
      {messages.map((m, i) =>
        "photo" in m ? (
          <QuotePhoto key={i} name={m.photo} />
        ) : (
          <p
            key={i}
            className={`whitespace-pre-line rounded-2xl px-3.5 py-2 ${
              m.from === "couple"
                ? `max-w-[82%] self-end rounded-br-md ${SENT}`
                : `max-w-[86%] self-start rounded-bl-md ${RECEIVED}`
            }`}
          >
            {m.text}
          </p>
        )
      )}
    </div>
  )
}

/** One text, floated beside a screen to show what was sent. */
export function TextChip({
  text,
  from = "couple",
  className = "",
}: {
  text: string
  from?: "couple" | "planner"
  className?: string
}) {
  return (
    <p
      className={`max-w-[250px] rounded-2xl px-3.5 py-2 text-[13px] leading-snug shadow-[0_18px_40px_-18px_rgba(11,16,13,0.55)] ${
        from === "couple" ? `rounded-br-md ${SENT}` : `rounded-bl-md ${RECEIVED}`
      } ${className}`}
    >
      {text}
    </p>
  )
}

/** A text conversation laid out like the Messages app: contact, texts, text box. */
export function MessagesCard({ messages, className = "" }: { messages: ThreadMessage[]; className?: string }) {
  return (
    <div className={`${CARD} flex flex-col overflow-hidden ${className}`}>
      <div className="flex flex-col items-center gap-1 border-b border-black/[0.06] bg-[#F9F9F9] pb-3 pt-4">
        <Image src="/icon-192.png" alt="" width={44} height={44} className="size-11 rounded-full ring-1 ring-black/5" />
        <span className="text-xs text-[#111]">
          Altared <span className="text-ink-muted">›</span>
        </span>
      </div>
      <div className="px-3.5 py-3.5">
        <TextThread messages={messages} bare className="text-[13.5px]" />
      </div>
      <div className="flex items-center gap-2 px-3.5 pb-3.5" aria-hidden>
        <span className="flex size-8 flex-none items-center justify-center rounded-full bg-[#E9E9EB] text-lg leading-none text-[#8a8a8e]">
          +
        </span>
        <span className="flex h-8 flex-1 items-center rounded-full border border-black/15 px-3.5 text-xs text-[#a1a1a6]">
          iMessage
        </span>
      </div>
    </div>
  )
}

export const HERO_THREAD: ThreadMessage[] = [
  { from: "couple", photo: "Bloom & Co quote" },
  { from: "couple", text: "Can you add this florist?" },
  {
    from: "planner",
    text: "Added Bloom & Co. $4,150 all-in with delivery, and the $950 deposit is due Nov 3.",
  },
]

export const CHECKIN_THREAD: ThreadMessage[] = [
  { from: "planner", text: "How'd the call with Marigold Photo go?" },
  { from: "couple", text: "Really good, they're holding our date until Friday" },
  {
    from: "planner",
    text: "Love that. I moved them to Negotiating and added \"Sign with Marigold\" for Thursday so it doesn't slip.",
  },
]

// ── Hero: the dashboard, with a texted quote showing up in it ───────────────

const HERO_PIPELINE: { stage: string; vendors: [string, string, boolean?][] }[] = [
  { stage: "Quoted", vendors: [["Bloom & Co", "Florist · $4,150", true], ["Rose Studio", "Florist · $4,800"]] },
  { stage: "Negotiating", vendors: [["Marigold Photo", "Photography"]] },
  { stage: "Booked", vendors: [["The Orchard", "Venue"], ["Harbor Strings", "Music"]] },
]

/** The dashboard: countdown, budget bar, vendor pipeline and what's next. */
export function DashboardMock({ className = "" }: { className?: string }) {
  return (
    <div className={`${CARD} w-full overflow-hidden text-[12.5px] md:text-[14px] ${className}`}>
      <div className="p-4 sm:p-5 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <Label>Sam &amp; Jordan</Label>
            <p className="font-display text-xl font-bold tracking-[-0.03em] md:text-[1.7rem]">142 days to go</p>
          </div>
          <p className="text-ink-muted">
            <b className="font-display text-[15px] font-bold text-ink tabular-nums">$17,100</b> of $32,000
          </p>
        </div>

        <div className="mt-2.5 flex h-2 gap-0.5 overflow-hidden rounded-full bg-ink/[0.07]" aria-hidden>
          <i className="block h-full bg-moss" style={{ width: "37.5%" }} />
          <i className="block h-full bg-sage" style={{ width: "10.3%" }} />
          <i className="block h-full bg-champagne" style={{ width: "5.6%" }} />
        </div>

        <div className="mt-4">
          <Label>Vendors</Label>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            {HERO_PIPELINE.map((col) => (
              <div key={col.stage} className="rounded-2xl bg-ink/[0.03] p-1.5">
                <p
                  className={`mb-1.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    col.stage === "Booked" ? "bg-sage-soft text-moss" : "bg-ink/[0.05] text-ink-muted"
                  }`}
                >
                  {col.stage}
                </p>
                <div className="space-y-1.5">
                  {col.vendors.map(([name, detail, fromText]) => (
                    <div
                      key={name}
                      className={`rounded-xl border bg-white px-2 py-1.5 ${
                        fromText ? "border-[#0A84FF]/50 ring-2 ring-[#0A84FF]/15" : "border-hairline"
                      }`}
                    >
                      <p className="truncate text-[11.5px] font-semibold md:text-[13.5px]">{name}</p>
                      <p className="truncate text-[10px] text-ink-muted md:text-[11.5px]">{detail}</p>
                      {fromText && (
                        <span className="mt-1 block">
                          <FromText />
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <Label>Next up</Label>
          <ul className="mt-1 divide-y divide-hairline">
            {[
              ["Nov 3", "Bloom & Co deposit · $950", true],
              ["Nov 9", "Sign with Marigold", false],
            ].map(([date, title, fromText]) => (
              <li key={title as string} className="flex items-center gap-2 py-1.5">
                <span className="w-11 flex-none text-[10.5px] font-bold uppercase text-moss md:w-14 md:text-xs">{date}</span>
                <span className="truncate">{title}</span>
                {fromText && <FromText />}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

// ── How it works: a screen from the app, with the text that filled it ───────

/** A scanned catering quote, line by line, with the extras flagged. */
export function QuoteBreakdownCard() {
  return (
    <div className={`${CARD} w-full max-w-md p-6 text-sm`}>
      <div className="flex items-center justify-between gap-3">
        <Label>Golden Hour · catering quote</Label>
        <FromText />
      </div>
      <dl className="mt-4 grid grid-cols-[1fr_auto] gap-x-4 gap-y-2.5">
        <dt>Dinner, $92 × 120 guests</dt>
        <dd className="tabular-nums">$11,040</dd>
        <dt className="text-ink-muted">Service charge, 20%</dt>
        <dd className="tabular-nums text-flag">+ $2,208</dd>
        <dt className="text-ink-muted">Cake cutting, $3 a guest</dt>
        <dd className="tabular-nums text-flag">+ $360</dd>
        <dt className="text-ink-muted">Staff and rentals</dt>
        <dd className="text-ink-muted">Included</dd>
      </dl>
      <div className="my-4 h-px bg-hairline" />
      <div className="flex justify-between font-display text-xl font-bold tracking-[-0.02em]">
        <span>Full cost</span>
        <span className="tabular-nums">$13,608</span>
      </div>
      <p className="mt-2 text-xs text-ink-muted">Saved under Quotes, with the photo you sent.</p>
    </div>
  )
}

const CATEGORIES: { name: string; spent: number; budget: number; paid?: string }[] = [
  { name: "Venue", spent: 12000, budget: 12500 },
  { name: "Photography", spent: 3300, budget: 3500, paid: "$1,200 deposit paid" },
  { name: "Music", spent: 1800, budget: 2500 },
  { name: "Florals", spent: 0, budget: 6000 },
]

const money = (n: number) => `$${n.toLocaleString("en-US")}`

/** Budget by category, with a payment that was logged by text. */
export function BudgetCategoriesCard() {
  return (
    <div className={`${CARD} w-full max-w-md p-6 text-sm`}>
      <div className="flex items-baseline justify-between">
        <Label>Budget</Label>
        <span className="text-xs text-ink-muted">
          <b className="text-ink">$14,900</b> left of $32,000
        </span>
      </div>
      <ul className="mt-4 space-y-3.5">
        {CATEGORIES.map((c) => (
          <li key={c.name}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-semibold">{c.name}</span>
              <span className="tabular-nums text-ink-muted">
                {money(c.spent)} <span className="text-[11px]">of {money(c.budget)}</span>
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink/[0.07]" aria-hidden>
              <i className="block h-full rounded-full bg-moss" style={{ width: `${(c.spent / c.budget) * 100}%` }} />
            </div>
            {c.paid && (
              <span className="mt-1.5 flex items-center gap-2 text-xs text-moss">
                {c.paid} <FromText />
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Two florist quotes compared on full price, with the planner's pick. */
export function CompareCard() {
  return (
    <div className={`${CARD} w-full max-w-md p-6 text-sm`}>
      <Label>Florists · compare</Label>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {[
          { name: "Bloom & Co", quote: "$3,800", full: "$4,150", extra: "+ $350 delivery", pick: true },
          { name: "Rose Studio", quote: "$4,800", full: "$4,800", extra: "All-in", pick: false },
        ].map((v) => (
          <div
            key={v.name}
            className={`rounded-2xl border p-3.5 ${v.pick ? "border-moss bg-sage-soft/40" : "border-hairline"}`}
          >
            <p className="font-semibold">{v.name}</p>
            <p className="text-xs text-ink-muted">Quote {v.quote}</p>
            <p className="mt-3 font-display text-xl font-bold tabular-nums tracking-[-0.02em]">{v.full}</p>
            <p className={`text-[11px] ${v.pick ? "text-flag" : "text-ink-muted"}`}>{v.extra}</p>
            {v.pick && (
              <span className="mt-2 inline-flex rounded-full bg-moss px-2 py-0.5 text-[10px] font-bold text-white">
                Top pick
              </span>
            )}
          </div>
        ))}
      </div>
      <p className="mt-4 rounded-2xl bg-paper px-3.5 py-2.5 text-[13px] leading-snug">
        Bloom &amp; Co is $650 less all-in and covers the ceremony arch. Rose Studio only wins if you want peonies
        out of season.
      </p>
    </div>
  )
}

/** The task list after a check-in reply: the vendor moved and a task added. */
export function TaskUpdateCard() {
  return (
    <div className={`${CARD} w-full max-w-sm p-5 text-sm`}>
      <Label>Tasks</Label>
      <ul className="mt-3 space-y-2.5">
        <li className="flex items-start gap-3 rounded-2xl border border-[#0A84FF]/40 p-3 ring-2 ring-[#0A84FF]/10">
          <span className="mt-0.5 size-4 flex-none rounded-full border-2 border-ink/25" />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">Sign with Marigold</span>
            <span className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
              Thu, Nov 9 <FromText />
            </span>
          </span>
        </li>
        <li className="flex items-start gap-3 p-3">
          <span className="mt-0.5 flex size-4 flex-none items-center justify-center rounded-full bg-moss text-[9px] text-white">
            ✓
          </span>
          <span className="block text-ink-muted line-through">Call Marigold Photo</span>
        </li>
        <li className="flex items-start gap-3 p-3">
          <span className="mt-0.5 size-4 flex-none rounded-full border-2 border-ink/25" />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">Cake tasting</span>
            <span className="block text-xs text-ink-muted">Tue, Nov 14</span>
          </span>
        </li>
      </ul>
      <div className="mt-3 flex items-center justify-between rounded-2xl bg-paper px-3 py-2 text-xs">
        <span>
          Marigold Photo → <b>Negotiating</b>
        </span>
        <FromText />
      </div>
    </div>
  )
}
