// Product illustrations for the landing page, drawn in HTML so they stay crisp
// and match the app. Figures are illustrative. Cards are
// light so they stand out against both the paper hero and the green bands.

const CARD =
  "rounded-3xl border border-black/5 bg-white text-ink shadow-[0_30px_60px_-30px_rgba(11,16,13,0.45)]"

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-muted">{children}</span>
  )
}

/** Hero: two florist quotes compared on full price, floated over the photo. */
export function HeroQuoteCard({ className = "" }: { className?: string }) {
  return (
    <div className={`${CARD} w-[290px] p-4 text-[13px] ${className}`}>
      <Label>Florists · compare</Label>
      <div className="mt-3 flex items-start justify-between">
        <div>
          <p className="font-semibold">Bloom &amp; Co</p>
          <p className="text-[11px] text-ink-muted">Quote $3,800</p>
        </div>
        <div className="text-right">
          <p className="font-semibold tabular-nums">$4,150</p>
          <p className="text-[10px] text-ink-muted">full cost</p>
        </div>
      </div>
      <span className="mt-2 inline-flex rounded-full bg-flag-soft px-2 py-0.5 text-[10.5px] font-semibold text-flag">
        + $350 delivery &amp; setup
      </span>
      <div className="my-3 h-px bg-hairline" />
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold">Rose Studio</p>
          <p className="text-[11px] text-ink-muted">Quote $4,500</p>
        </div>
        <div className="text-right">
          <p className="font-semibold tabular-nums">$4,500</p>
          <p className="text-[10px] text-ink-muted">all-in</p>
        </div>
      </div>
    </div>
  )
}

/** Hero: a partner's reaction chip. */
export function HeroReactionChip({ className = "" }: { className?: string }) {
  return (
    <div className={`${CARD} flex max-w-[240px] items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-[12.5px] ${className}`}>
      <span className="flex size-7 flex-none items-center justify-center rounded-full bg-champagne font-display text-xs font-bold">
        J
      </span>
      <span>
        <b>Jordan</b> loved Bloom &amp; Co
        <span className="block text-[11px] text-ink-muted">&ldquo;Their portfolio is the one.&rdquo;</span>
      </span>
    </div>
  )
}

/** Story 1: one quote with the extras added, totalled. */
export function QuoteLinesCard() {
  return (
    <div className={`${CARD} w-full max-w-md p-6`}>
      <Label>Bloom &amp; Co · florist</Label>
      <dl className="mt-4 grid grid-cols-[1fr_auto] gap-x-4 gap-y-2.5 text-sm">
        <dt>Ceremony and reception florals</dt>
        <dd className="tabular-nums">$3,800</dd>
        <dt className="text-ink-muted">Delivery and setup</dt>
        <dd className="tabular-nums text-flag">+ $350</dd>
        <dt className="text-ink-muted">Breakdown after the reception</dt>
        <dd className="text-ink-muted">Included</dd>
      </dl>
      <div className="my-4 h-px bg-hairline" />
      <div className="flex justify-between font-display text-xl font-bold tracking-[-0.02em]">
        <span>Full cost</span>
        <span className="tabular-nums">$4,150</span>
      </div>
    </div>
  )
}

/** Story 2: deposits and final payments coming up. */
export function PaymentsCard() {
  const rows = [
    { month: "Nov", day: "3", title: "Deposit · Bloom & Co", detail: "$950 · due in 8 days", due: true },
    { month: "Dec", day: "1", title: "Venue · final payment", detail: "$5,250", due: false },
    { month: "Jan", day: "15", title: "Photographer · final payment", detail: "$2,100", due: false },
  ]
  return (
    <div className={`${CARD} w-full max-w-md p-6`}>
      <Label>Coming up</Label>
      <ul className="mt-2 divide-y divide-hairline">
        {rows.map((row) => (
          <li key={row.title} className="flex items-center gap-3 py-3">
            <span className="w-11 flex-none rounded-xl bg-sage-soft py-1 text-center text-[10px] font-bold uppercase leading-tight text-moss">
              {row.month}
              <span className="block font-display text-base">{row.day}</span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{row.title}</span>
              <span className="block text-xs text-ink-muted">{row.detail}</span>
            </span>
            {row.due && (
              <span className="rounded-full bg-flag-soft px-2 py-0.5 text-[10.5px] font-bold text-flag">Due soon</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Story 3: partner reactions through a share link. */
export function ShareCard() {
  return (
    <div className={`${CARD} flex w-full max-w-md flex-col gap-3 p-6 text-sm`}>
      <Label>Shared with Jordan</Label>
      <p className="max-w-[85%] rounded-2xl rounded-bl-md bg-paper px-4 py-3">
        Bloom &amp; Co is $350 less all-in. Their portfolio is the one we loved.
      </p>
      <p className="max-w-[85%] self-end rounded-2xl rounded-br-md bg-champagne px-4 py-3">
        Bloom still wins. Let&apos;s book them 💐
      </p>
      <p className="text-xs text-ink-muted">Partners react from a link. They don&apos;t need an account.</p>
    </div>
  )
}
