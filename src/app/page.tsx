import { TrackedCTA } from "@/components/shared/tracked-cta";
import { MarketingFooter, MarketingHeader } from "@/components/blog/MarketingShell";
import Image from "next/image";
import { ScrollReveal } from "@/components/landing/scroll-reveal";
import {
  HeroQuoteCard,
  HeroReactionChip,
  PaymentsCard,
  QuoteLinesCard,
  ShareCard,
} from "@/components/landing/product-mocks";
import { PLANS, TRIAL_DAYS } from "@/lib/stripe/config";

// The landing page leads with the job most visitors came to do: the blog's
// biggest category is hidden costs, so the default headline is about quotes.
// Blog CTAs and ads pass ?from=<category> to swap the headline and CTA.

interface Variant {
  line1: string;
  line2: string;
  sub: string;
  cta: string;
}

const DEFAULT_VARIANT: Variant = {
  line1: "Every vendor quote.",
  line2: "One calm plan.",
  sub: "Add your quotes, see each vendor's full cost, and decide side by side with your partner.",
  cta: "Add your vendor quotes free",
};

const VARIANTS: Record<string, Variant> = {
  "hidden-costs": DEFAULT_VARIANT,
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

const STORIES = [
  {
    eyebrow: "Compare",
    title: "Quotes, compared",
    accent: "on the full price.",
    body: "Type in each quote and the extras the vendor mentioned, like service charges, overtime or delivery. Altared adds them up so vendors compare fairly.",
    visual: <QuoteLinesCard />,
  },
  {
    eyebrow: "Pay",
    title: "Know what's due,",
    accent: "and when.",
    body: "Deposits and final payments for every vendor sit in one list. With the Wedding Pass, you also get an email a week before each deposit is due.",
    visual: <PaymentsCard />,
  },
  {
    eyebrow: "Decide",
    title: "Decide",
    accent: "together.",
    body: "Send your partner or parents a link to your shortlist. They see the quotes and leave reactions, without making an account.",
    visual: <ShareCard />,
  },
];

// Photos: Unsplash License, see docs/landing-image-credits.md
const ALSO = [
  {
    title: "Budget by category",
    body: "See what's committed and what's left for venue, food, photos and the rest.",
    image: "/landing/reception-tables.jpg",
    alt: "Reception tables set with white flowers and candles",
  },
  {
    title: "Tasks and reminders",
    body: "Keep tastings, fittings and follow-ups on one list.",
    image: "/landing/bride-bouquet.jpg",
    alt: "A bride holding a white bouquet",
  },
  {
    title: "One inbox for vendors",
    body: "Keep vendor messages next to the vendor they're about.",
    image: "/landing/woodland-ceremony.jpg",
    alt: "An outdoor ceremony set up among pine trees",
  },
  {
    title: "AI quote scanning",
    body: "Upload a vendor's proposal and AI pulls out the costs, schedule and terms.",
    image: "/landing/rose-bouquet.jpg",
    alt: "A bouquet of white roses and heather",
  },
];

const FAQS = [
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
        {/* ── Hero: copy beside a photo with product cards floating over it ── */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-8 md:grid-cols-[1.15fr_1fr] md:gap-14 md:px-8 md:pb-24 md:pt-16">
          <div className="flex flex-col gap-5">
            <h1 className="font-display text-[2.6rem] font-bold leading-[0.98] tracking-[-0.055em] text-balance sm:text-6xl lg:text-[3.7rem]">
              <span className="motion-rise block">{variant.line1}</span>
              <span className="motion-rise block text-moss-light [animation-delay:120ms]">{variant.line2}</span>
            </h1>
            <p className="motion-rise max-w-[44ch] text-[17px] leading-relaxed text-ink-muted [animation-delay:240ms] md:text-lg">
              {variant.sub}
            </p>
            <div className="motion-rise flex flex-col gap-3 pt-1 [animation-delay:340ms] sm:flex-row sm:items-center sm:gap-5">
              <TrackedCTA
                href={signupHref}
                location="hero_primary"
                className="lift inline-flex min-h-13 items-center justify-center rounded-full bg-moss px-7 py-3.5 font-display text-base font-bold text-white transition-colors hover:bg-moss-light"
              >
                {variant.cta}
              </TrackedCTA>
              <p className="text-center text-sm text-ink-muted sm:text-left">
                Free for {TRIAL_DAYS} days. No card needed.
              </p>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[460px] pb-14 md:pb-10">
            <div className="motion-settle relative aspect-[4/5] overflow-hidden rounded-[2rem] [animation-delay:150ms]">
              <Image
                src="/landing/hero-couple.jpg"
                alt="A bride and groom laughing as they walk hand in hand across a lawn"
                fill
                priority
                sizes="(min-width: 768px) 460px, 100vw"
                className="object-cover object-[50%_45%]"
              />
            </div>
            <HeroReactionChip className="motion-rise absolute -right-8 top-[7%] hidden [animation-delay:900ms] md:flex" />
            <HeroQuoteCard className="motion-rise absolute bottom-0 left-3 [animation-delay:650ms] md:-left-12" />
          </div>
        </section>

        {/* ── How it works: three moments ──────────────────────────────── */}
        <section id="how-it-works" className="scroll-mt-16 bg-moss text-[#F1EFE8]">
          <div className="mx-auto flex max-w-6xl flex-col gap-20 px-5 py-20 md:gap-28 md:px-8 md:py-28">
            {STORIES.map((story, i) => (
              <div
                key={story.eyebrow}
                className={`grid items-center gap-8 md:grid-cols-2 md:gap-16 ${i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""}`}
              >
                <div className="reveal flex flex-col gap-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#B7C4B3]">
                    {i + 1} of 3 · {story.eyebrow}
                  </p>
                  <h2 className="font-display text-4xl font-bold leading-[1.02] tracking-[-0.05em] md:text-5xl">
                    {story.title}
                    <br />
                    <span className="text-champagne">{story.accent}</span>
                  </h2>
                  <p className="max-w-[46ch] text-[17px] leading-relaxed text-[#C9D3C6]">{story.body}</p>
                </div>
                <div className="reveal-side flex justify-center [transition-delay:150ms] md:justify-start">
                  {story.visual}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Everything else, with photography ────────────────────────── */}
        <section className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-24">
          <h2 className="reveal font-display text-3xl font-bold tracking-[-0.045em] md:text-4xl">
            Everything else, <span className="text-moss-light">in the same place.</span>
          </h2>
          <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
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
                Your first {TRIAL_DAYS} days include every feature, with no card needed. If Altared
                helps, the Wedding Pass keeps it all through your wedding.
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
