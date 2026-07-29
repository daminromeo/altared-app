import { NextResponse, after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { trackTikTokEvent } from '@/lib/tiktok/events'

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
          // New registration — fire TikTok CompleteRegistration (OAuth path).
          // after() guarantees it runs after the response instead of being cut
          // off when the redirect returns. New-signup Slack alerts now come
          // from the Supabase profiles-insert webhook, which covers BOTH email
          // (auto-confirmed, never reaches here) and OAuth signups.
          after(() =>
            trackTikTokEvent({ event: 'CompleteRegistration', email: user.email })
          )

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
