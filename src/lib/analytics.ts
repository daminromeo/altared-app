// Lightweight client-side funnel analytics.
//
// Fires events to Google Analytics (gtag) and, when a TikTok mapping is given,
// to the TikTok pixel (ttq). Both globals are loaded in src/app/layout.tsx.
// Safe to call from anywhere — no-ops during SSR and never throws.

type EventValue = string | number | boolean | null | undefined
type EventProps = Record<string, EventValue>

declare global {
  interface Window {
    gtag?: (
      command: "event" | "config" | "js",
      target: string,
      params?: Record<string, unknown>
    ) => void
    ttq?: {
      track: (event: string, props?: Record<string, unknown>) => void
      page?: () => void
    }
  }
}

/**
 * Track a funnel event.
 *
 * @param name   GA4 event name (snake_case), e.g. "onboarding_step_completed".
 * @param props  Event parameters for GA4.
 * @param tiktok Optional TikTok pixel event (use TikTok's standard event names,
 *               e.g. "CompleteRegistration", so the pixel can optimize on it).
 */
export function trackEvent(
  name: string,
  props: EventProps = {},
  tiktok?: { event: string; props?: Record<string, unknown> }
): void {
  if (typeof window === "undefined") return

  try {
    window.gtag?.("event", name, props)
  } catch {
    // analytics must never break the app
  }

  if (tiktok) {
    try {
      window.ttq?.track(tiktok.event, tiktok.props ?? {})
    } catch {
      // ignore
    }
  }
}
