import { TrackedCTA } from "@/components/shared/tracked-cta";
import { MarketingFooter, MarketingHeader } from "@/components/blog/MarketingShell";
import Image from "next/image";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import {
  BudgetCategoriesCard,
  CHECKIN_THREAD,
  CompareCard,
  DashboardMock,
  HERO_THREAD,
  MessagesCard,
  QuoteBreakdownCard,
  TaskUpdateCard,
  TextChip,
  TextThread,
} from "@/components/landing/product-mocks";
import { PLANS, TRIAL_DAYS } from "@/lib/stripe/config";

// The landing page leads with the whole plan (vendors, quotes, budget, to-dos)
// and the planner you can text as the way into it: every visual is a screen
// from the app, with the text that filled it beside it. Blog CTAs and ads pass
// ?from=<category> to swap in a headline about the job that reader came for.

interface Variant {
  line1: string;
  line2: string;
  sub: string;
  cta: string;
}

const DEFAULT_VARIANT: Variant = {
  line1: "Your whole wedding plan.",
  line2: "Just a text away.",
  sub: "Vendors, quotes, budget and to-dos in one calm dashboard. Text your planner a photo of a quote or a quick update, and it's there.",
  cta: "Start planning free",
};

const VARIANTS: Record<string, Variant> = {
  "hidden-costs": {
    line1: "Every vendor quote.",
    line2: "One calm plan.",
    sub: "Add any quote, or just text a photo of it, and see the full cost with the extras included. Then compare side by side with your partner.",
    cta: "Add your vendor quotes free",
  },
  contracts: {
    line1: "Every deposit and due date.",
    line2: "In one place.",
    sub: "See what you owe each vendor and when it's due, next to the quote you agreed to.",
    cta: "Track your vendor payments free",
  },
  budgeting: {
    line1: "Know what's spent.",
    line2: "Know what's left.",
    sub: "Set your budget, add vendors as you book them, and see what's left in every category.",
    cta: "Start your wedding budget free",
  },
  "vendor-tips": {
    line1: "Compare vendors.",
    line2: "Decide together.",
    sub: "Line up quotes side by side, weigh what matters to you, and share the shortlist with your partner.",
    cta: "Compare your vendors free",
  },
};

// How the app and texting fit together
const HOW = [
  { title: "Text what happened", body: "A photo of a quote, a payment you made, a question about the budget." },
  { title: "Your plan updates", body: "Vendors, budget and tasks get filed where they belong, as if you'd typed them in." },
  { title: "See it all in one place", body: "Open the dashboard to check it, change it, or share it with your partner." },
];

// Each story is a screen from the app, with the text that filled it
const STORIES = [
  {
    eyebrow: "Quotes",
    title: "Every quote, read",
    accent: "down to the fine print.",
    body: "Upload a quote or text a photo of it. Altared pulls out each line, adds the extras like service charges and per-guest fees, and saves it with the vendor.",
    visual: <QuoteBreakdownCard />,
    chip: { text: "📷 Golden Hour quote. Anything weird in here?", className: "-top-12 right-2 md:-right-6" },
  },
  {
    eyebrow: "Budget",
    title: "Know what's spent,",
    accent: "and what's left.",
    body: "Every category against what you set for it, updated as you book and pay. Log a payment in your dashboard, or just text it.",
    visual: <BudgetCategoriesCard />,
    chip: { text: "Paid the photographer deposit, $1,200", className: "-bottom-5 right-2 md:-right-8" },
  },
  {
    eyebrow: "Decide",
    title: "Compare fairly.",
    accent: "Decide together.",
    body: "Line up vendors side by side, extras included, and get a straight recommendation. Send your partner or parents a link and they can react without an account.",
    visual: <CompareCard />,
    chip: { text: "Which florist should we book?", className: "-top-5 right-2 md:-right-6" },
  },
];

// Photos: Unsplash License, see docs/landing-image-credits.md
const ALSO = [
  {
    title: "A timeline from day one",
    body: "Your plan starts with the usual planning steps, timed to your wedding date.",
    image: "/landing/bride-bouquet.jpg",
    alt: "A bride holding a white bouquet",
  },
  {
    title: "Deposits on time",
    body: "An email a week before each deposit or payment is due.",
    image: "/landing/reception-tables.jpg",
    alt: "Reception tables set with white flowers and candles",
  },
  {
    title: "One inbox for vendors",
    body: "Vendor emails sit next to the vendor they're about.",
    image: "/landing/hero-couple.jpg",
    alt: "A bride and groom laughing as they walk hand in hand across a lawn",
  },
  {
    title: "Shared with your partner",
    body: "A link to your shortlist. They see the quotes and leave reactions.",
    image: "/landing/rose-bouquet.jpg",
    alt: "A bouquet of white roses and heather",
  },
];

const FAQS = [
  {
    q: "Is my planner a real person?",
    a: "No, it's AI. It knows wedding planning in depth: booking timelines, what vendors typically charge, and the fees and contract terms worth questioning. It answers from your own plan, so the advice fits your date, budget and vendors. Everything it adds or changes shows up in your dashboard, where you can check or edit it.",
  },
  {
    q: "Do I need to download an app?",
    a: "No. Connect your phone once from your dashboard, then text like you normally would. It works with iMessage on iPhone and with texting on Android.",
  },
  {
    q: "Will it text me all the time?",
    a: "No. It only checks in when there's something specific to ask about, never more than every few days, and you can turn check-ins off in Settings.",
  },
  {
    q: "Is this a subscription?",
    a: `No. The Wedding Pass is one payment of $${PLANS.pass.price}. It lasts through your wedding, and there's nothing to cancel.`,
  },
  {
    q: `What happens after the ${TRIAL_DAYS}-day trial?`,
    a: "To keep using Altared, get the Wedding Pass. Nothing is deleted: every vendor, quote and budget line you added stays saved, and it's all there the moment you get the pass.",
  },
  {
    q: "How long does the Wedding Pass last?",
    a: "Until 30 days after your wedding, and at least 18 months from purchase. If your date moves later, the pass moves with it.",
  },
  {
    q: "Who can see our budget?",
    a: "Only you, and anyone you send a share link to. Vendors never see it.",
  },
];


export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const variantKey = from && VARIANTS[from] ? from : "default";
  const variant = VARIANTS[variantKey] ?? DEFAULT_VARIANT;
  const signupHref = variantKey === "default" ? "/get-started" : `/get-started?from=${variantKey}`;
  const pass = PLANS.pass;

  return (
    <div className="min-h-screen bg-paper text-ink">
      <MarketingHeader ctaHref={signupHref} />

      <ScrollReveal />
      <main className="overflow-x-clip">
        {/* ── Hero: over a ceremony photo, the dashboard with a text that just landed in it ── */}
        <section className="relative isolate overflow-hidden text-[#F7F3EC]">
          <Image
            src="/landing/hero-woodland.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="-z-10 object-cover object-[50%_65%]"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#141a16]/85 via-[#141a16]/65 to-[#141a16]/45 md:bg-gradient-to-r md:from-[#141a16]/90 md:via-[#141a16]/60 md:to-[#141a16]/25" />
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-10 md:grid-cols-[1.05fr_1fr] md:gap-10 md:px-8 md:py-28">
            <div className="flex flex-col gap-6">
              <h1 className="font-display text-[2.9rem] font-bold leading-[0.96] tracking-[-0.055em] text-balance sm:text-7xl md:text-[3.4rem] xl:text-[4.5rem]">
                <span className="motion-rise block">{variant.line1}</span>
                <span className="motion-rise block text-champagne [animation-delay:120ms]">{variant.line2}</span>
              </h1>
              <p className="motion-rise max-w-[42ch] text-lg leading-relaxed text-[#E4E0D6] [animation-delay:240ms] md:text-xl xl:text-[1.35rem]">
                {variant.sub}
              </p>
              <div className="motion-rise flex flex-col gap-3 pt-1 [animation-delay:340ms] sm:flex-row sm:items-center sm:gap-5">
                <TrackedCTA
                  href={signupHref}
                  location="hero_primary"
                  className="lift inline-flex min-h-14 items-center justify-center whitespace-nowrap rounded-full bg-champagne px-8 py-4 font-display text-lg font-bold text-ink transition-opacity hover:opacity-90"
                >
                  {variant.cta}
                </TrackedCTA>
                <p className="text-center text-[15px] text-[#D9D4C8] sm:text-left">
                  Free for {TRIAL_DAYS} days. No card needed.
                </p>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[620px] pb-44 md:pb-36">
              <DashboardMock className="motion-settle md:w-[88%] [animation-delay:150ms]" />
              <MessagesCard
                messages={HERO_THREAD}
                className="motion-rise absolute -right-1 top-52 w-[270px] [animation-delay:650ms] md:right-0 md:top-52 md:w-[280px] xl:-right-4 xl:w-[320px]"
              />
            </div>
          </div>
        </section>

        {/* ── How it works: a screen from the app, and the text that filled it ── */}
        <section id="how-it-works" className="scroll-mt-16 bg-moss text-[#F1EFE8]">
          <div className="mx-auto flex max-w-6xl flex-col gap-20 px-5 py-20 md:gap-28 md:px-8 md:py-28">
            <div className="reveal mx-auto max-w-4xl text-center">
              <h2 className="font-display text-4xl font-bold leading-[1.02] tracking-[-0.05em] md:text-5xl">
                Open your dashboard, or just text.
                <br />
                <span className="text-champagne">It&apos;s all one plan.</span>
              </h2>
              <ol className="mt-10 grid gap-3 text-left sm:grid-cols-3">
                {HOW.map((step, i) => (
                  <li
                    key={step.title}
                    className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:block sm:p-5"
                  >
                    <span className="flex size-7 flex-none items-center justify-center rounded-full bg-champagne font-display text-sm font-bold text-ink">
                      {i + 1}
                    </span>
                    <span className="block">
                      <span className="block font-display text-lg font-bold tracking-[-0.02em] sm:mt-3">{step.title}</span>
                      <span className="mt-1 block text-sm leading-relaxed text-[#C9D3C6]">{step.body}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            {STORIES.map((story, i) => (
              <div
                key={story.eyebrow}
                className={`grid items-center gap-10 md:grid-cols-2 md:gap-16 ${i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""}`}
              >
                <div className="reveal flex flex-col gap-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#B7C4B3]">
                    {i + 1} of 3 · {story.eyebrow}
                  </p>
                  <h3 className="font-display text-4xl font-bold leading-[1.02] tracking-[-0.05em] md:text-5xl">
                    {story.title}
                    <br />
                    <span className="text-champagne">{story.accent}</span>
                  </h3>
                  <p className="max-w-[46ch] text-[17px] leading-relaxed text-[#C9D3C6]">{story.body}</p>
                </div>
                <div className="reveal-side flex justify-center [transition-delay:150ms] md:justify-start">
                  <div className="relative w-full max-w-md">
                    {story.visual}
                    <TextChip text={story.chip.text} className={`absolute ${story.chip.className}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Check-ins: the planner texts first ────────────────────────── */}
        <section className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
          <div className="grid items-center gap-12 md:grid-cols-[1fr_1.15fr] md:gap-16">
            <div className="reveal flex flex-col gap-4">
              <h2 className="font-display text-4xl font-bold leading-[1.02] tracking-[-0.05em] md:text-5xl">
                It checks in,
                <br />
                <span className="text-moss-light">like a planner would.</span>
              </h2>
              <p className="max-w-[46ch] text-[17px] leading-relaxed text-ink-muted">
                Every few days at most, about something specific in your plan: a call you had, a quote
                that&apos;s waiting, a vendor you haven&apos;t started looking for. Answer in a few words and
                your plan is up to date.
              </p>
              <p className="text-sm text-ink-muted">
                Works with iMessage and Android texting. No app to download.
              </p>
            </div>
            <div className="reveal-side flex flex-col items-center gap-5 [transition-delay:150ms] sm:flex-row sm:items-start sm:justify-center">
              <TextThread messages={CHECKIN_THREAD} className="sm:max-w-[290px]" />
              <TaskUpdateCard />
            </div>
          </div>
        </section>

        {/* ── Everything else, with photography ────────────────────────── */}
        <section className="border-t border-hairline">
          <div className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-24">
            <h2 className="reveal font-display text-3xl font-bold tracking-[-0.045em] md:text-4xl">
              And the rest of the plan, <span className="text-moss-light">in the same place.</span>
            </h2>
            <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-4">
              {ALSO.map((item, i) => (
                <div
                  key={item.title}
                  className="reveal group flex flex-col gap-4"
                  style={{ transitionDelay: `${i * 110}ms` }}
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
                    <Image
                      src={item.image}
                      alt={item.alt}
                      fill
                      sizes="(min-width: 1024px) 260px, (min-width: 640px) 45vw, 100vw"
                      className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05] motion-reduce:transition-none"
                    />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold tracking-[-0.02em]">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing: one product, free to try ────────────────────────── */}
        <section id="pricing" className="scroll-mt-16 border-t border-hairline">
          <div className="mx-auto grid max-w-5xl items-center gap-10 px-5 py-20 md:grid-cols-[1fr_1.05fr] md:gap-16 md:px-8 md:py-24">
            <div className="reveal">
              <h2 className="font-display text-4xl font-bold leading-[1.02] tracking-[-0.05em] md:text-5xl">
                Try everything free.
                <br />
                <span className="text-moss-light">Then pay once.</span>
              </h2>
              <p className="mt-4 max-w-[44ch] text-[17px] text-ink-muted">
                Your first {TRIAL_DAYS} days include everything, texting your planner too, with no card
                needed. If Altared helps, the Wedding Pass keeps it all through your wedding.
              </p>
            </div>

            <div className="reveal-side flex flex-col rounded-3xl border-2 border-moss bg-white p-7 [transition-delay:150ms] md:p-8">
              <div className="flex items-baseline justify-between gap-4">
                <p className="font-display text-xl font-bold">{pass.name}</p>
                <p className="font-display text-4xl font-bold tracking-[-0.04em]">
                  ${pass.price}
                  <span className="ml-1.5 font-sans text-sm font-semibold tracking-normal text-ink-muted">once</span>
                </p>
              </div>
              <ul className="mt-6 flex flex-col gap-2.5 text-[15px]">
                {pass.features.map((f) => (
                  <li key={f.text} className="flex gap-2.5">
                    <span className="text-moss" aria-hidden>✓</span>
                    {f.text}
                  </li>
                ))}
              </ul>
              <TrackedCTA
                href={signupHref}
                location="pricing_pass"
                className="lift mt-7 inline-flex min-h-12 items-center justify-center rounded-full bg-moss font-display text-sm font-bold text-white transition-colors hover:bg-moss-light"
              >
                Start your free {TRIAL_DAYS} days
              </TrackedCTA>
              <p className="mt-3 text-center text-xs text-ink-muted">
                No card to start. No subscription. Lasts through your wedding.
              </p>
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────────── */}
        <section className="border-t border-hairline">
          <div className="mx-auto max-w-3xl px-5 py-20 md:px-8">
            <h2 className="font-display text-3xl font-bold tracking-[-0.045em]">Questions</h2>
            <div className="reveal mt-8 divide-y divide-hairline border-y border-hairline">
              {FAQS.map((faq) => (
                <details key={faq.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-[17px] font-bold tracking-[-0.02em] [&::-webkit-details-marker]:hidden">
                    {faq.q}
                    <span className="text-xl text-ink-muted transition-transform group-open:rotate-45" aria-hidden>
                      +
                    </span>
                  </summary>
                  <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-ink-muted">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Close: full-bleed photo ──────────────────────────────────── */}
        <section className="relative isolate overflow-hidden text-[#F7F3EC]">
          <Image
            src="/landing/dance-floor.jpg"
            alt="A bride dancing with her guests at the reception"
            fill
            sizes="100vw"
            className="parallax -z-10 object-cover object-[50%_30%]"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#141a16]/90 via-[#141a16]/55 to-[#141a16]/25" />
          <div className="mx-auto flex min-h-[560px] max-w-6xl flex-col items-start justify-end gap-6 px-5 py-16 md:min-h-[640px] md:px-8 md:py-20">
            <h2 className="reveal font-display text-4xl font-bold leading-[1.02] tracking-[-0.05em] md:text-6xl">
              Spend the day on the dance floor.
              <br />
              <span className="text-champagne">Not in a spreadsheet.</span>
            </h2>
            <TrackedCTA
              href={signupHref}
              location="closing"
              className="lift inline-flex min-h-13 items-center rounded-full bg-champagne px-7 py-3.5 font-display text-base font-bold text-ink transition-opacity hover:opacity-90"
            >
              {variant.cta}
            </TrackedCTA>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
