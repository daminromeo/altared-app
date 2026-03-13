import Link from "next/link";
import { DM_Sans, Playfair_Display } from "next/font/google";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

// ── Feature data ──────────────────────────────────────────────────────────────

const features = [
  {
    title: "Smart Vendor Comparison",
    description:
      "Compare vendors side by side with weighted scoring, auto-generated insights, and AI-powered recommendations to make confident decisions.",
    icon: (
      <svg
        className="h-7 w-7"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
        />
      </svg>
    ),
    color: "#8B9F82",
  },
  {
    title: "AI Proposal Scanner",
    description:
      "Instantly extract key details from vendor proposals — costs, schedules, and terms — with one click.",
    icon: (
      <svg
        className="h-7 w-7"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
        />
      </svg>
    ),
    color: "#C9A96E",
  },
  {
    title: "Budget Tracker",
    description:
      "Real-time budget tracking with visual breakdowns by category. Always know where your money is going.",
    icon: (
      <svg
        className="h-7 w-7"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
        />
      </svg>
    ),
    color: "#C4A0A0",
  },
  {
    title: "Collaborative Sharing",
    description:
      "Share a live view of your plans with your partner, family, or wedding planner. They can browse vendors, view budgets, and leave reactions — no account needed.",
    icon: (
      <svg
        className="h-7 w-7"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
        />
      </svg>
    ),
    color: "#C4A0A0",
  },
  {
    title: "Unified Inbox",
    description:
      "All vendor communications in one place. Never lose track of an important conversation again.",
    icon: (
      <svg
        className="h-7 w-7"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
        />
      </svg>
    ),
    color: "#8B9F82",
  },
] as const;

// ── Pricing data ──────────────────────────────────────────────────────────────

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started",
    features: [
      "Up to 10 vendors",
      "Basic budget tracking",
      "Basic vendor comparison (2 vendors)",
      "Manual proposal entry",
      "Message & communication log",
    ],
    cta: "Get Started Free",
    href: "/signup",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$9",
    period: "/month",
    description: "For couples serious about planning",
    features: [
      "Up to 50 vendors",
      "Full budget tracking by category",
      "Advanced vendor comparison (4 vendors)",
      "Weighted scoring & AI recommendations",
      "Collaborative sharing & reactions",
      "10 AI proposal scans/month",
      "Unlimited task & reminder management",
      "Vendor import from URL",
    ],
    cta: "Start Free Trial",
    href: "/get-started",
    highlighted: true,
  },
  {
    name: "Premium",
    price: "$19",
    period: "/month",
    description: "Unlimited everything for full peace of mind",
    features: [
      "Unlimited vendors",
      "Advanced vendor comparison (4 vendors)",
      "Weighted scoring & AI recommendations",
      "Collaborative sharing & reactions",
      "Unlimited AI proposal scans",
      "Priority email support",
    ],
    cta: "Start Free Trial",
    href: "/get-started",
    highlighted: false,
  },
] as const;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div
      className={`${dmSans.variable} ${playfair.variable} min-h-screen bg-[#FAF8F5]`}
      style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
    >
      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-[#E8E4DF]/60 bg-[#FAF8F5]/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#8B9F82]">
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <span
              className="text-xl font-bold text-[#2D2D2D]"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              Altared
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm font-medium text-[#7A7A7A] transition-colors hover:text-[#2D2D2D]"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium text-[#7A7A7A] transition-colors hover:text-[#2D2D2D]"
            >
              Pricing
            </a>
            <Link
              href="/login"
              className="text-sm font-medium text-[#7A7A7A] transition-colors hover:text-[#2D2D2D]"
            >
              Sign In
            </Link>
            <Link
              href="/get-started"
              className="inline-flex h-9 items-center rounded-lg bg-[#8B9F82] px-4 text-sm font-medium text-white transition-colors hover:bg-[#7A8E71]"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu toggle (simple link-based for server component) */}
          <Link
            href="/get-started"
            className="inline-flex h-9 items-center rounded-lg bg-[#8B9F82] px-4 text-sm font-medium text-white transition-colors hover:bg-[#7A8E71] md:hidden"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero Section ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(139,159,130,0.12) 0%, rgba(201,169,110,0.08) 40%, rgba(196,160,160,0.06) 70%, transparent 100%)",
          }}
        />

        {/* Decorative circles */}
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#8B9F82]/5 blur-3xl" />
        <div className="absolute -left-32 top-48 h-80 w-80 rounded-full bg-[#C9A96E]/5 blur-3xl" />
        <div className="absolute bottom-0 right-16 h-64 w-64 rounded-full bg-[#C4A0A0]/5 blur-3xl" />

        <div className="mx-auto max-w-6xl px-6 pb-24 pt-20 md:pb-32 md:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            {/* Headline */}
            <h1
              className="text-4xl font-bold leading-tight tracking-tight text-[#2D2D2D] sm:text-5xl md:text-6xl lg:text-7xl"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              Your Wedding,{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #8B9F82, #C9A96E, #C4A0A0)",
                }}
              >
                Perfectly
              </span>{" "}
              Organized
            </h1>

            {/* Subheadline */}
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#7A7A7A] sm:text-xl">
              Compare vendors, scan proposals with AI, and manage your wedding
              budget — all in one place.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/get-started"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-[#8B9F82] px-8 text-base font-semibold text-white shadow-lg shadow-[#8B9F82]/25 transition-all hover:bg-[#7A8E71] hover:shadow-xl hover:shadow-[#8B9F82]/30"
              >
                Get Started Free
              </Link>
              <a
                href="#features"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#E8E4DF] bg-white px-8 text-base font-semibold text-[#2D2D2D] shadow-sm transition-all hover:border-[#8B9F82]/30 hover:shadow-md"
              >
                See How It Works
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </a>
            </div>

            {/* Social proof */}
            <p className="mt-12 text-sm text-[#7A7A7A]">
              Trusted by{" "}
              <span className="font-semibold text-[#2D2D2D]">thousands of</span>{" "}
              couples planning their perfect day
            </p>
          </div>
        </div>
      </section>

      {/* ── Features Section ───────────────────────────────────────────── */}
      <section id="features" className="border-t border-[#E8E4DF]/60 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#C9A96E]">
              Everything You Need
            </p>
            <h2
              className="mt-3 text-3xl font-bold tracking-tight text-[#2D2D2D] sm:text-4xl"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              Wedding planning, simplified
            </h2>
            <p className="mt-4 text-lg text-[#7A7A7A]">
              From first inquiry to final payment, Altared keeps every detail
              organized so you can focus on the celebration.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative rounded-2xl border border-[#E8E4DF] bg-[#FAF8F5] p-6 transition-all hover:border-[#8B9F82]/30 hover:shadow-lg hover:shadow-[#8B9F82]/5"
              >
                <div
                  className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${feature.color}15` }}
                >
                  <span style={{ color: feature.color }}>{feature.icon}</span>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-[#2D2D2D]">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-[#7A7A7A]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Product Showcase ─────────────────────────────────────────── */}
      <section className="border-t border-[#E8E4DF]/60 bg-[#FAF8F5]">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          {/* Budget Tracker */}
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-[#C9A96E]">
                Budget Tracker
              </p>
              <h2
                className="mt-3 text-3xl font-bold tracking-tight text-[#2D2D2D] sm:text-4xl"
                style={{ fontFamily: "var(--font-playfair), serif" }}
              >
                Know where every dollar goes
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-[#7A7A7A]">
                Track spending by category with visual breakdowns. See estimated
                vs actual costs, monitor deposits, and never go over budget.
              </p>
            </div>
            <div className="rounded-2xl border border-[#E8E4DF] bg-white p-6 shadow-lg shadow-black/5">
              {/* Mock budget UI */}
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#2D2D2D]">Budget Overview</h3>
                <span className="text-xs text-[#7A7A7A]">$18,500 / $30,000</span>
              </div>
              <div className="mb-6 h-3 w-full rounded-full bg-[#E5E7EB]">
                <div className="h-3 rounded-full bg-[#8B9F82]" style={{ width: "62%" }} />
              </div>
              <div className="space-y-3">
                {[
                  { label: "Venue", amount: "$8,000", pct: "44%", color: "#8B9F82" },
                  { label: "Photography", amount: "$4,500", pct: "24%", color: "#C9A96E" },
                  { label: "Catering", amount: "$3,200", pct: "17%", color: "#C4A0A0" },
                  { label: "Florals", amount: "$2,800", pct: "15%", color: "#8B9F82" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="flex-1 text-sm text-[#2D2D2D]">{item.label}</span>
                    <span className="text-sm font-medium text-[#2D2D2D]">{item.amount}</span>
                    <span className="w-10 text-right text-xs text-[#7A7A7A]">{item.pct}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Vendor Comparison */}
          <div className="mt-24 grid items-center gap-12 lg:grid-cols-2">
            <div className="order-2 rounded-2xl border border-[#E8E4DF] bg-white p-6 shadow-lg shadow-black/5 lg:order-1">
              {/* Mock comparison UI with scoring */}
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#2D2D2D]">Smart Vendor Comparison</h3>
                <span className="inline-flex items-center rounded-full bg-[#8B9F82]/10 px-2 py-0.5 text-[10px] font-semibold text-[#8B9F82]">AI-Powered</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                {/* Vendor A */}
                <div className="rounded-lg bg-[#FAF8F5] p-3">
                  <div className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#8B9F82]/15 text-xs font-bold text-[#8B9F82]">A</div>
                  <p className="text-xs font-medium text-[#2D2D2D]">Rose Studio</p>
                  <p className="mt-1 text-sm font-bold text-[#2D2D2D]">$4,500</p>
                  <div className="mt-2 text-lg font-bold text-[#D97706]">72<span className="text-[10px] font-normal text-[#7A7A7A]">/100</span></div>
                  <div className="mx-auto mt-1 h-1.5 w-16 rounded-full bg-[#E8E4DF]">
                    <div className="h-full rounded-full bg-[#D97706]" style={{ width: "72%" }} />
                  </div>
                </div>
                {/* Vendor B - Best Match */}
                <div className="rounded-lg border-2 border-[#047857]/30 bg-[#047857]/5 p-3">
                  <div className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#047857]/15 text-xs font-bold text-[#047857]">B</div>
                  <p className="text-xs font-medium text-[#2D2D2D]">Bloom & Co</p>
                  <p className="mt-1 text-sm font-bold text-[#2D2D2D]">$3,800</p>
                  <div className="mt-2 text-lg font-bold text-[#047857]">91<span className="text-[10px] font-normal text-[#7A7A7A]">/100</span></div>
                  <div className="mx-auto mt-1 h-1.5 w-16 rounded-full bg-[#E8E4DF]">
                    <div className="h-full rounded-full bg-[#047857]" style={{ width: "91%" }} />
                  </div>
                  <span className="mt-2 inline-block rounded-full bg-[#047857]/10 px-2 py-0.5 text-[9px] font-bold text-[#047857] uppercase">Best Match</span>
                </div>
                {/* Vendor C */}
                <div className="rounded-lg bg-[#FAF8F5] p-3">
                  <div className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#C4A0A0]/15 text-xs font-bold text-[#C4A0A0]">C</div>
                  <p className="text-xs font-medium text-[#2D2D2D]">Petal Works</p>
                  <p className="mt-1 text-sm font-bold text-[#2D2D2D]">$5,200</p>
                  <div className="mt-2 text-lg font-bold text-[#DC2626]/70">48<span className="text-[10px] font-normal text-[#7A7A7A]">/100</span></div>
                  <div className="mx-auto mt-1 h-1.5 w-16 rounded-full bg-[#E8E4DF]">
                    <div className="h-full rounded-full bg-[#DC2626]/60" style={{ width: "48%" }} />
                  </div>
                </div>
              </div>
              {/* Mock AI recommendation */}
              <div className="mt-4 rounded-lg border border-[#8B9F82]/20 bg-[#8B9F82]/5 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <svg className="h-3.5 w-3.5 text-[#8B9F82]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  <span className="text-[10px] font-semibold text-[#8B9F82]">AI Recommendation</span>
                </div>
                <p className="text-[11px] leading-relaxed text-[#2D2D2D]">
                  <strong>Bloom & Co</strong> is your best match — lowest price with a perfect 5-star rating and fast response time.
                </p>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-sm font-semibold uppercase tracking-widest text-[#8B9F82]">
                Smart Comparison
              </p>
              <h2
                className="mt-3 text-3xl font-bold tracking-tight text-[#2D2D2D] sm:text-4xl"
                style={{ fontFamily: "var(--font-playfair), serif" }}
              >
                Your personal vendor matchmaker
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-[#7A7A7A]">
                Set your priorities — price, quality, responsiveness — and let our
                smart scoring engine rank your vendors instantly. Get AI-powered
                recommendations, auto-generated pros and cons, and color-coded
                insights to book with confidence.
              </p>
            </div>
          </div>
          {/* Collaborative Sharing */}
          <div className="mt-24 grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-[#C4A0A0]">
                Collaborative Sharing
              </p>
              <h2
                className="mt-3 text-3xl font-bold tracking-tight text-[#2D2D2D] sm:text-4xl"
                style={{ fontFamily: "var(--font-playfair), serif" }}
              >
                Plan together, even apart
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-[#7A7A7A]">
                Share a magic link with your partner, parents, or wedding planner
                — no sign-up required. They get a beautiful read-only view of
                your vendors, budget, and comparison scores. Plus they can leave
                thumbs up/down reactions and notes on every vendor, so everyone
                stays on the same page.
              </p>
            </div>
            <div className="rounded-2xl border border-[#E8E4DF] bg-white p-6 shadow-lg shadow-black/5">
              {/* Mock shared view UI */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#C4A0A0]/15">
                    <svg className="h-4 w-4 text-[#C4A0A0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-[#2D2D2D]">Shared View</h3>
                </div>
                <span className="rounded-full bg-[#8B9F82]/10 px-2.5 py-0.5 text-[10px] font-medium text-[#8B9F82]">
                  View Only
                </span>
              </div>
              {/* Mock vendor cards with reactions */}
              <div className="space-y-3">
                {[
                  { name: "Bloom & Co", category: "Florist", price: "$3,800", reaction: "up", note: "Love their portfolio!" },
                  { name: "Rose Studio", category: "Florist", price: "$4,500", reaction: "down", note: "A bit pricey for us" },
                  { name: "Petal Works", category: "Florist", price: "$5,200", reaction: null, note: null },
                ].map((vendor) => (
                  <div
                    key={vendor.name}
                    className="flex items-center justify-between rounded-lg border border-[#E8E4DF] p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#2D2D2D]">{vendor.name}</p>
                      <p className="text-[10px] text-[#7A7A7A]">{vendor.category} &middot; {vendor.price}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {vendor.reaction === "up" && (
                        <div className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-1">
                          <span className="text-xs">👍</span>
                          <span className="text-[10px] font-medium text-green-700">Love it</span>
                        </div>
                      )}
                      {vendor.reaction === "down" && (
                        <div className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-1">
                          <span className="text-xs">👎</span>
                          <span className="text-[10px] font-medium text-red-700">Not sure</span>
                        </div>
                      )}
                      {vendor.reaction === null && (
                        <div className="flex gap-1">
                          <div className="rounded-full bg-[#FAF8F5] px-2 py-1 text-[10px] text-[#7A7A7A]">👍</div>
                          <div className="rounded-full bg-[#FAF8F5] px-2 py-1 text-[10px] text-[#7A7A7A]">👎</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {/* Mock comment */}
              <div className="mt-3 rounded-lg bg-[#FAF8F5] p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#C4A0A0]/15 text-[9px] font-bold text-[#C4A0A0]">J</div>
                  <span className="text-[10px] font-medium text-[#2D2D2D]">Jordan</span>
                </div>
                <p className="text-[11px] text-[#7A7A7A] italic">
                  &ldquo;Love their portfolio! Let&apos;s definitely book a consultation.&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works Section ───────────────────────────────────────── */}
      <section className="border-t border-[#E8E4DF]/60 bg-[#FAF8F5]">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#8B9F82]">
              Simple Process
            </p>
            <h2
              className="mt-3 text-3xl font-bold tracking-tight text-[#2D2D2D] sm:text-4xl"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              From chaos to clarity in minutes
            </h2>
          </div>

          <div className="mt-16 grid gap-12 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Add Your Vendors",
                description:
                  "Import from The Knot or WeddingWire, or add vendors manually. Track status, contacts, and costs.",
              },
              {
                step: "02",
                title: "Upload Proposals",
                description:
                  "Drop in vendor proposals and let AI extract the details. Compare pricing, services, and terms at a glance.",
              },
              {
                step: "03",
                title: "Stay on Track",
                description:
                  "Monitor your budget in real-time, set deposit reminders, and keep all conversations in one unified inbox.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#8B9F82]/10">
                  <span
                    className="text-xl font-bold text-[#8B9F82]"
                    style={{ fontFamily: "var(--font-playfair), serif" }}
                  >
                    {item.step}
                  </span>
                </div>
                <h3 className="mb-2 text-xl font-semibold text-[#2D2D2D]">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-[#7A7A7A]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing Section ────────────────────────────────────────────── */}
      <section
        id="pricing"
        className="relative border-t border-[#E8E4DF]/60 bg-white"
      >
        {/* Subtle gradient background */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 100%, rgba(201,169,110,0.06) 0%, transparent 70%)",
          }}
        />

        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#C4A0A0]">
              Simple Pricing
            </p>
            <h2
              className="mt-3 text-3xl font-bold tracking-tight text-[#2D2D2D] sm:text-4xl"
              style={{ fontFamily: "var(--font-playfair), serif" }}
            >
              Plans for every stage of planning
            </h2>
            <p className="mt-4 text-lg text-[#7A7A7A]">
              Start free and upgrade as your vendor list grows. Cancel anytime.
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border p-8 transition-all hover:shadow-lg ${
                  plan.highlighted
                    ? "border-[#8B9F82] bg-white shadow-lg shadow-[#8B9F82]/10"
                    : "border-[#E8E4DF] bg-white"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center rounded-full bg-[#8B9F82] px-4 py-1 text-xs font-semibold text-white shadow-sm">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-[#2D2D2D]">
                    {plan.name}
                  </h3>
                  <p className="mt-1 text-sm text-[#7A7A7A]">
                    {plan.description}
                  </p>
                </div>

                <div className="mb-6">
                  <span
                    className="text-4xl font-bold text-[#2D2D2D]"
                    style={{ fontFamily: "var(--font-playfair), serif" }}
                  >
                    {plan.price}
                  </span>
                  <span className="text-[#7A7A7A]">{plan.period}</span>
                </div>

                <ul className="mb-8 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm"
                    >
                      <svg
                        className="mt-0.5 h-4 w-4 shrink-0 text-[#8B9F82]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-[#2D2D2D]">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`inline-flex h-11 items-center justify-center rounded-xl text-sm font-semibold transition-all ${
                    plan.highlighted
                      ? "bg-[#8B9F82] text-white shadow-md shadow-[#8B9F82]/25 hover:bg-[#7A8E71] hover:shadow-lg hover:shadow-[#8B9F82]/30"
                      : "border border-[#E8E4DF] bg-[#FAF8F5] text-[#2D2D2D] hover:border-[#8B9F82]/30 hover:bg-[#8B9F82]/5"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ────────────────────────────────────────────────── */}
      <section
        className="border-t border-[#E8E4DF]/60"
        style={{
          background:
            "linear-gradient(135deg, #8B9F82 0%, #7A8E71 50%, #6B7F62 100%)",
        }}
      >
        <div className="mx-auto max-w-6xl px-6 py-20 text-center md:py-28">
          <h2
            className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            Ready to simplify your wedding planning?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
            Join thousands of couples who traded spreadsheet stress for peace of
            mind.
          </p>
          <div className="mt-10">
            <Link
              href="/get-started"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-8 text-base font-semibold text-[#8B9F82] shadow-lg transition-all hover:bg-[#FAF8F5] hover:shadow-xl"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#E8E4DF]/60 bg-[#FAF8F5]">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            {/* Brand */}
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#8B9F82]">
                  <svg
                    className="h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
                <span
                  className="text-lg font-bold text-[#2D2D2D]"
                  style={{ fontFamily: "var(--font-playfair), serif" }}
                >
                  Altared
                </span>
              </Link>
              <p className="mt-3 text-sm text-[#7A7A7A]">
                Wedding vendor management, simplified.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-[#2D2D2D]">
                Product
              </h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#features"
                    className="text-sm text-[#7A7A7A] transition-colors hover:text-[#2D2D2D]"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="text-sm text-[#7A7A7A] transition-colors hover:text-[#2D2D2D]"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <Link
                    href="/get-started"
                    className="text-sm text-[#7A7A7A] transition-colors hover:text-[#2D2D2D]"
                  >
                    Get Started
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-[#2D2D2D]">
                Legal
              </h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-sm text-[#7A7A7A] transition-colors hover:text-[#2D2D2D]"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-[#7A7A7A] transition-colors hover:text-[#2D2D2D]"
                  >
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-[#E8E4DF] pt-8 text-center">
            <p className="text-sm text-[#7A7A7A]">
              &copy; {new Date().getFullYear()} Altared. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
