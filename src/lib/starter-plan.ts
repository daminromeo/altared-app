// The starter plan: a standard wedding planning timeline, counted back from the
// couple's date and added to their tasks so the dashboard has something to do
// on day one. Tasks are ordinary reminders tagged with plan_key (migration 010),
// so they can be edited, ticked off or deleted like any other task.

import type { SupabaseClient } from '@supabase/supabase-js'

interface PlanStep {
  key: string
  title: string
  description: string
  daysBefore: number
  /** Onboarding category id this step belongs to; general steps have none */
  category?: string
}

const STEPS: PlanStep[] = [
  { key: 'set-budget', title: 'Set your total budget', description: 'Every quote is easier to judge against a number.', daysBefore: 395 },
  { key: 'guest-list', title: 'Draft your guest list', description: 'Your headcount sets the venue size and most of the catering cost.', daysBefore: 365 },
  { key: 'book-venue', title: 'Book your venue', description: 'Popular dates go 12 months or more ahead.', daysBefore: 350, category: 'venue' },
  { key: 'book-photographer', title: 'Book a photographer', description: 'Get 2 or 3 quotes and compare them on full cost.', daysBefore: 300, category: 'photographer' },
  { key: 'book-caterer', title: 'Book a caterer', description: 'Check whether your venue requires its own.', daysBefore: 290, category: 'caterer' },
  { key: 'book-planner', title: 'Hire a planner or day-of coordinator', description: 'Even a day-of coordinator takes the timeline off your hands.', daysBefore: 280, category: 'planner' },
  { key: 'book-videographer', title: 'Book a videographer', description: 'They often book alongside photographers.', daysBefore: 270, category: 'videographer' },
  { key: 'book-music', title: 'Book a DJ or band', description: 'Ask what the quote includes for ceremony sound.', daysBefore: 240, category: 'music' },
  { key: 'book-florist', title: 'Book a florist', description: 'Watch for delivery, setup and breakdown fees.', daysBefore: 240, category: 'florist' },
  { key: 'order-attire', title: 'Order your wedding attire', description: 'Dresses can take six months or more to arrive.', daysBefore: 240, category: 'attire' },
  { key: 'save-the-dates', title: 'Send save-the-dates', description: 'Earlier if guests will travel.', daysBefore: 210 },
  { key: 'choose-officiant', title: 'Choose your officiant', description: 'Check what your state needs for the license.', daysBefore: 180 },
  { key: 'book-cake', title: 'Book your cake or desserts', description: 'Ask whether cutting and plating cost extra.', daysBefore: 150, category: 'cake' },
  { key: 'book-beauty', title: 'Book hair and makeup', description: 'Schedule a trial run too.', daysBefore: 150, category: 'beauty' },
  { key: 'order-invitations', title: 'Order invitations', description: 'Printing and addressing take longer than you think.', daysBefore: 120, category: 'stationery' },
  { key: 'book-transportation', title: 'Book transportation', description: 'Shuttles for guests, and a ride for the two of you.', daysBefore: 120, category: 'transportation' },
  { key: 'menu-tasting', title: 'Schedule your menu tasting', description: 'Bring your final guest count estimate.', daysBefore: 90, category: 'caterer' },
  { key: 'payment-schedule', title: "List every vendor's payment due dates", description: 'Add them to each vendor so Altared reminds you before they are due.', daysBefore: 90 },
  { key: 'send-invitations', title: 'Send invitations', description: 'About eight weeks before the day.', daysBefore: 56 },
  { key: 'final-headcount', title: 'Send your final headcount', description: 'Your caterer and venue need it about three weeks out.', daysBefore: 21 },
  { key: 'day-of-timeline', title: 'Send the day-of timeline to vendors', description: 'Arrival times, contacts and the order of the day.', daysBefore: 14 },
  { key: 'final-payments', title: 'Final payments and tips ready', description: 'Envelopes labelled by vendor, handed to someone you trust.', daysBefore: 7 },
]

/** Categories assumed when an account never picked any (older accounts). */
const DEFAULT_CATEGORIES = ['venue', 'photographer', 'caterer', 'florist']

/** Words that identify each onboarding category in a vendor category name. */
const CATEGORY_MATCH: Record<string, string[]> = {
  venue: ['venue'],
  photographer: ['photo'],
  videographer: ['video'],
  caterer: ['cater'],
  florist: ['flor', 'flower'],
  music: ['dj', 'band', 'music'],
  cake: ['cake', 'bak', 'dessert'],
  attire: ['attire', 'dress', 'suit'],
  beauty: ['hair', 'makeup', 'beauty'],
  stationery: ['station', 'invitation'],
  transportation: ['transport'],
  planner: ['planner', 'coordinator'],
}

const DAY_MS = 24 * 60 * 60 * 1000
/** Tasks that would already be late are spread over this window instead */
const CATCH_UP_START_DAYS = 3
const CATCH_UP_END_DAYS = 21

const SEASON_MIDPOINTS: Record<string, [month: number, day: number]> = {
  winter: [0, 15],
  spring: [3, 15],
  summer: [6, 15],
  fall: [9, 15],
}

export interface PlanProfile {
  wedding_date: string | null
  wedding_date_estimate?: string | null
  planned_categories?: string[] | null
  total_budget?: number | null
}

export interface WeddingAnchor {
  date: Date
  /** How the date is known: the exact day, a season, or not at all */
  precision: 'exact' | 'season' | 'none'
}

/** The date the plan counts back from. Unknown dates assume about 15 months out. */
export function weddingAnchor(profile: PlanProfile, now = new Date()): WeddingAnchor {
  if (profile.wedding_date) {
    return { date: new Date(`${profile.wedding_date}T17:00:00Z`), precision: 'exact' }
  }
  const [year, season] = (profile.wedding_date_estimate ?? '').split('-')
  const midpoint = SEASON_MIDPOINTS[season]
  if (midpoint && Number(year)) {
    return { date: new Date(Date.UTC(Number(year), midpoint[0], midpoint[1], 17)), precision: 'season' }
  }
  const guess = new Date(now)
  guess.setUTCMonth(guess.getUTCMonth() + 15)
  return { date: guess, precision: 'none' }
}

function startOfDayUtc(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 17))
}

function matchesCategory(categoryId: string, vendorCategoryName: string) {
  const name = vendorCategoryName.toLowerCase()
  return (CATEGORY_MATCH[categoryId] ?? [categoryId]).some((word) => name.includes(word))
}

export interface PlannedTask {
  plan_key: string
  title: string
  description: string
  due_date: string
}

/**
 * The plan's tasks with due dates. Nothing is ever due in the past: steps that
 * would already be late are spread across the next few weeks as catch-up, and
 * steps for categories that are already booked are left out.
 */
export function buildStarterPlan(
  profile: PlanProfile,
  { bookedCategoryNames = [] as string[], now = new Date() } = {}
): PlannedTask[] {
  const anchor = weddingAnchor(profile, now).date
  const today = startOfDayUtc(now)
  const daysToGo = Math.floor((anchor.getTime() - today.getTime()) / DAY_MS)
  if (daysToGo <= CATCH_UP_START_DAYS) return []

  const categories = profile.planned_categories?.length ? profile.planned_categories : DEFAULT_CATEGORIES
  const steps = STEPS.filter((step) => {
    if (step.key === 'set-budget' && (profile.total_budget ?? 0) > 0) return false
    if (!step.category) return true
    if (!categories.includes(step.category)) return false
    return !bookedCategoryNames.some((name) => matchesCategory(step.category!, name))
  })

  const earliest = today.getTime() + CATCH_UP_START_DAYS * DAY_MS
  const natural = steps.map((step) => ({ step, due: anchor.getTime() - step.daysBefore * DAY_MS }))
  const late = natural.filter((t) => t.due < earliest)
  const onTime = natural.filter((t) => t.due >= earliest)

  // Spread late steps evenly, in their natural order, ending before the wedding
  const windowDays = Math.max(0, Math.min(CATCH_UP_END_DAYS, daysToGo - 1) - CATCH_UP_START_DAYS)
  const caughtUp = late.map((t, i) => ({
    step: t.step,
    due: earliest + Math.round((late.length > 1 ? (i * windowDays) / (late.length - 1) : 0)) * DAY_MS,
  }))

  return [...caughtUp, ...onTime]
    .sort((a, b) => a.due - b.due)
    .map(({ step, due }) => ({
      plan_key: step.key,
      title: step.title,
      description: step.description,
      due_date: new Date(due).toISOString(),
    }))
}

async function loadPlanInputs(supabase: SupabaseClient, userId: string) {
  const [profileResult, vendorsResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase
      .from('vendors')
      .select('vendor_categories(name)')
      .eq('user_id', userId)
      .eq('status', 'booked'),
  ])
  if (profileResult.error) throw profileResult.error
  const bookedCategoryNames = (vendorsResult.data ?? [])
    // Typed as an array by the client, but a to-one join returns an object
    .map((v) => (v as unknown as { vendor_categories: { name: string } | null }).vendor_categories?.name)
    .filter((name): name is string => !!name)
  return { profile: profileResult.data as PlanProfile, bookedCategoryNames }
}

/**
 * Adds the starter plan to the couple's tasks. Steps already in their tasks
 * (including ones they ticked off) are skipped, so this is safe to repeat.
 * Returns how many tasks were added.
 */
export async function addStarterPlan(supabase: SupabaseClient, userId: string, now = new Date()) {
  const { profile, bookedCategoryNames } = await loadPlanInputs(supabase, userId)
  const tasks = buildStarterPlan(profile, { bookedCategoryNames, now })

  const { data, error } = await supabase
    .from('reminders')
    .upsert(
      tasks.map((task) => ({
        user_id: userId,
        title: task.title,
        description: task.description,
        due_date: task.due_date,
        plan_key: task.plan_key,
        plan_due_date: task.due_date,
        reminder_type: 'deadline',
        is_completed: false,
      })),
      { onConflict: 'user_id,plan_key', ignoreDuplicates: true }
    )
    .select('id')
  if (error) throw error

  await supabase
    .from('profiles')
    .update({ starter_plan_at: now.toISOString() })
    .eq('id', userId)
    .is('starter_plan_at', null)

  return data?.length ?? 0
}

/** Removes the plan's open tasks. Ticked-off ones stay as a record. */
export async function clearStarterPlan(supabase: SupabaseClient, userId: string) {
  const { error } = await supabase
    .from('reminders')
    .delete()
    .eq('user_id', userId)
    .eq('is_completed', false)
    .not('plan_key', 'is', null)
  if (error) throw error
}

/**
 * Moves open plan tasks to fit a new wedding date. Tasks whose due date the
 * couple changed are left where they put them.
 */
export async function rescheduleStarterPlan(supabase: SupabaseClient, userId: string, now = new Date()) {
  const { data: open, error } = await supabase
    .from('reminders')
    .select('id, plan_key, due_date, plan_due_date')
    .eq('user_id', userId)
    .eq('is_completed', false)
    .not('plan_key', 'is', null)
  if (error) throw error
  if (!open?.length) return 0

  const { profile, bookedCategoryNames } = await loadPlanInputs(supabase, userId)
  const planned = new Map(
    buildStarterPlan(profile, { bookedCategoryNames, now }).map((task) => [task.plan_key, task.due_date])
  )

  const moves = open.filter((task) => {
    const untouched =
      task.plan_due_date && new Date(task.due_date).getTime() === new Date(task.plan_due_date).getTime()
    const next = planned.get(task.plan_key)
    return untouched && next && new Date(next).getTime() !== new Date(task.due_date).getTime()
  })

  await Promise.all(
    moves.map((task) =>
      supabase
        .from('reminders')
        .update({ due_date: planned.get(task.plan_key), plan_due_date: planned.get(task.plan_key) })
        .eq('id', task.id)
    )
  )
  return moves.length
}
