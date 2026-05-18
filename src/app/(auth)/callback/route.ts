import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { trackTikTokEvent } from '@/lib/tiktok/events'
import { notifyNewSignup } from '@/lib/slack/notify'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // If coming from the get-started flow, redirect to complete page
        // which will save onboarding data from sessionStorage
        const referer = request.headers.get('referer') ?? ''
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .maybeSingle()

        if (!profile || !profile.onboarding_completed) {
          // New registration — fire TikTok CompleteRegistration event
          trackTikTokEvent({
            event: 'CompleteRegistration',
            email: user.email,
          })

          // Fire Slack notification only on a fresh signup. The profile row is
          // created by a DB trigger at auth.users insert time, so "no profile"
          // never holds here — instead detect freshness via created_at (OAuth
          // new user) or email_confirmed_at (email user just confirmed).
          const FIVE_MIN = 5 * 60 * 1000
          const now = Date.now()
          const createdRecently =
            now - new Date(user.created_at).getTime() < FIVE_MIN
          const confirmedRecently =
            !!user.email_confirmed_at &&
            now - new Date(user.email_confirmed_at).getTime() < FIVE_MIN
          if (createdRecently || confirmedRecently) {
            void notifyNewSignup({
              email: user.email,
              name:
                (user.user_metadata?.full_name as string | undefined) ?? null,
              provider: user.app_metadata?.provider ?? 'email',
            })
          }

          // Redirect to get-started/complete to save onboarding data from sessionStorage
          return NextResponse.redirect(`${origin}/get-started/complete`)
        }
      }

      // Onboarding is complete, redirect to dashboard (or the `next` param)
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // Auth code exchange failed — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
