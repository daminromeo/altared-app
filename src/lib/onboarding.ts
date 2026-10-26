// Shared state, persistence and profile mapping for the onboarding wizards
// (/get-started for new visitors, /onboarding for signed-in users).
//
// Step 1 deliberately asks for estimates only: half of starters used to drop
// on a six-field screen. Names and venue are collected later from the
// dashboard checklist.

import type { SupabaseClient } from '@supabase/supabase-js'

export type DatePrecision = 'exact' | 'rough' | 'none'

export type GuestRange = 'under_50' | '50_100' | '100_150' | '150_plus' | 'unsure'

export interface WeddingBasicsData {
  /** null until the couple answers the date question */
  datePrecision: DatePrecision | null
  /** yyyy-MM-dd, set when datePrecision is 'exact' */
  weddingDate: string | null
  /** e.g. '2027-spring' or 'later', set when datePrecision is 'rough' */
  dateEstimate: string | null
  guestRange: GuestRange | null
}

export interface BudgetData {
  totalBudget: number
  /** "Not sure yet": saved as no budget so the dashboard keeps prompting for one */
  unsure: boolean
}

export interface VendorCategoriesData {
  selectedCategories: string[]
}

export interface OnboardingDraft {
  step: number
  basics: WeddingBasicsData
  budget: BudgetData
  categories: VendorCategoriesData
  /** Landing variant or traffic source that brought the couple in */
  from: string
}

// Funnel step names are GA4 parameter values; keep them stable so the funnel
// stays comparable with data collected before the redesign.
export const STEP_NAMES = ['Wedding Details', 'Budget', 'Vendor Categories', 'Create Account']

export const DEFAULT_DRAFT: OnboardingDraft = {
  step: 1,
  basics: { datePrecision: null, weddingDate: null, dateEstimate: null, guestRange: null },
  budget: { totalBudget: 30000, unsure: false },
  categories: { selectedCategories: ['venue', 'photographer', 'caterer', 'florist'] },
  from: 'direct',
}

// ── Option lists ─────────────────────────────────────────────────────────────

export const GUEST_RANGES: { value: GuestRange; label: string; estimate: number | null }[] = [
  { value: 'under_50', label: 'Under 50', estimate: 40 },
  { value: '50_100', label: '50–100', estimate: 75 },
  { value: '100_150', label: '100–150', estimate: 125 },
  { value: '150_plus', label: '150+', estimate: 175 },
  { value: 'unsure', label: 'Not sure', estimate: null },
]

const SEASONS = ['winter', 'spring', 'summer', 'fall'] as const
type Season = (typeof SEASONS)[number]

const SEASON_LABELS: Record<Season, string> = {
  winter: 'Winter',
  spring: 'Spring',
  summer: 'Summer',
  fall: 'Fall',
}

/** Winter spans December–February and is named for the year it ends in. */
function seasonOf(date: Date): { season: Season; year: number } {
  const month = date.getMonth()
  if (month === 11) return { season: 'winter', year: date.getFullYear() + 1 }
  if (month <= 1) return { season: 'winter', year: date.getFullYear() }
  if (month <= 4) return { season: 'spring', year: date.getFullYear() }
  if (month <= 7) return { season: 'summer', year: date.getFullYear() }
  return { season: 'fall', year: date.getFullYear() }
}

/** The next `count` seasons after the current one, plus a catch-all "Later". */
export function upcomingSeasonOptions(now = new Date(), count = 5) {
  const current = seasonOf(now)
  let index = SEASONS.indexOf(current.season)
  let year = current.year
  const options: { value: string; label: string }[] = []

  for (let i = 0; i < count; i++) {
    index += 1
    if (index === SEASONS.length) index = 0
    // Moving into winter crosses into the next named year
    if (SEASONS[index] === 'winter') year += 1
    const season = SEASONS[index]
    options.push({
      value: `${year}-${season}`,
      label: `${SEASON_LABELS[season]} '${String(year).slice(-2)}`,
    })
  }

  options.push({ value: 'later', label: 'Later' })
  return options
}

export function dateEstimateLabel(value: string): string {
  if (value === 'later') return 'Later'
  const [year, season] = value.split('-') as [string, Season]
  if (!SEASON_LABELS[season]) return value
  return `${SEASON_LABELS[season]} '${year.slice(-2)}`
}

// ── Summary (step 4) ─────────────────────────────────────────────────────────

export function summarizeDraft(draft: OnboardingDraft) {
  const { basics, budget, categories } = draft

  let when = 'Date TBD'
  if (basics.datePrecision === 'exact' && basics.weddingDate) {
    when = new Date(`${basics.weddingDate}T12:00:00`).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } else if (basics.datePrecision === 'rough' && basics.dateEstimate) {
    when = dateEstimateLabel(basics.dateEstimate)
  }

  const guestRange = GUEST_RANGES.find((r) => r.value === basics.guestRange)
  const guests = guestRange && guestRange.value !== 'unsure' ? guestRange.label : 'TBD'

  const budgetLabel = budget.unsure
    ? 'TBD'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(budget.totalBudget)

  const count = categories.selectedCategories.length
  return {
    when,
    guests,
    budget: budgetLabel,
    vendors: `${count} ${count === 1 ? 'vendor' : 'vendors'}`,
  }
}

// ── Persistence ──────────────────────────────────────────────────────────────

// sessionStorage keeps answers through a refresh, a failed signup, and the
// Google OAuth round trip (read back on /get-started/complete).
const DRAFT_KEY = 'onboarding_draft'

export function loadDraft(): OnboardingDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<OnboardingDraft>
    return {
      ...DEFAULT_DRAFT,
      ...parsed,
      basics: { ...DEFAULT_DRAFT.basics, ...parsed.basics },
      budget: { ...DEFAULT_DRAFT.budget, ...parsed.budget },
      categories: { ...DEFAULT_DRAFT.categories, ...parsed.categories },
    }
  } catch {
    return null
  }
}

export function saveDraft(draft: OnboardingDraft): void {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  } catch {
    // Private mode or storage full: the wizard still works in memory
  }
}

export function clearDraft(): void {
  try {
    sessionStorage.removeItem(DRAFT_KEY)
  } catch {
    // ignore
  }
}

/** Normalizes a `?from=` value so it is safe to use as an analytics parameter. */
export function sanitizeFrom(value: string | null | undefined): string | null {
  if (!value) return null
  const clean = value.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40)
  return clean || null
}

// ── Saving to the profile ────────────────────────────────────────────────────

/** Columns that exist in every deployed schema. */
function coreProfileFields(draft: OnboardingDraft) {
  const { basics, budget } = draft
  const guestRange = GUEST_RANGES.find((r) => r.value === basics.guestRange)
  return {
    wedding_date: basics.datePrecision === 'exact' ? basics.weddingDate : null,
    estimated_guest_count: guestRange?.estimate ?? null,
    total_budget: budget.unsure ? 0 : budget.totalBudget,
    onboarding_completed: true,
  }
}

/** Columns added in migration 008. */
function estimateProfileFields(draft: OnboardingDraft) {
  return {
    wedding_date_estimate:
      draft.basics.datePrecision === 'rough' ? draft.basics.dateEstimate : null,
    planned_categories: draft.categories.selectedCategories,
  }
}

/**
 * Writes the onboarding answers to the user's profile. Returns the error from
 * the core write, if any.
 *
 * The profile row is created by the handle_new_user trigger at signup, so this
 * is an update (profiles has no INSERT policy, which makes an upsert fail under
 * RLS). If the trigger hasn't landed yet the update matches nothing, so retry
 * briefly.
 *
 * The estimate columns are written separately and best-effort, so an
 * environment where migration 008 has not run yet still saves everything else.
 */
export async function saveOnboardingToProfile(
  supabase: SupabaseClient,
  user: { id: string },
  draft: OnboardingDraft
) {
  const core = coreProfileFields(draft)

  for (let attempt = 0; attempt < 4; attempt++) {
    const { data, error } = await supabase
      .from('profiles')
      .update(core)
      .eq('id', user.id)
      .select('id')
    if (error) return error
    if (data && data.length > 0) break
    if (attempt === 3) return new Error('Profile row not found after signup')
    await new Promise((r) => setTimeout(r, 400 * (attempt + 1)))
  }

  const { error: estimateError } = await supabase
    .from('profiles')
    .update(estimateProfileFields(draft))
    .eq('id', user.id)
  if (estimateError) {
    console.warn('Onboarding estimates not saved (has migration 008 run?):', estimateError.message)
  }

  return null
}
