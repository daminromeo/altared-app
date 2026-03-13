'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true)
    setError(null)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (signInError) {
      setError(signInError.message)
      setIsLoading(false)
      return
    }

    router.push('/dashboard')
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true)
    setError(null)

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/callback`,
      },
    })

    if (oauthError) {
      setError(oauthError.message)
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ backgroundColor: '#FAF8F5' }}>
      {/* Decorative background elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-24 -right-24 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: '#C4A0A0' }}
        />
        <div
          className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: '#8B9F82' }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo / App name */}
        <div className="mb-8 text-center">
          <h1
            className="text-4xl tracking-tight"
            style={{
              fontFamily: "'Playfair Display', serif",
              color: '#2D2D2D',
            }}
          >
            Altared
          </h1>
          <p
            className="mt-2 text-sm"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              color: '#7A7A7A',
            }}
          >
            Your wedding, beautifully managed
          </p>
        </div>

        <Card className="border-0 shadow-lg" style={{ backgroundColor: '#FFFFFF' }}>
          <CardHeader className="text-center">
            <CardTitle
              className="text-xl"
              style={{
                fontFamily: "'Playfair Display', serif",
                color: '#2D2D2D',
              }}
            >
              Welcome back
            </CardTitle>
            <CardDescription
              style={{
                fontFamily: "'DM Sans', sans-serif",
                color: '#7A7A7A',
              }}
            >
              Sign in to continue planning your special day
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Google OAuth */}
            <Button
              variant="outline"
              size="lg"
              className="w-full gap-2"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                borderColor: '#E5E2DD',
              }}
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <LoadingSpinner />
              ) : (
                <svg className="size-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              Continue with Google
            </Button>

            {/* Divider */}
            <div className="relative flex items-center">
              <div className="flex-1 border-t" style={{ borderColor: '#E5E2DD' }} />
              <span
                className="px-4 text-xs uppercase"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  color: '#7A7A7A',
                }}
              >
                or
              </span>
              <div className="flex-1 border-t" style={{ borderColor: '#E5E2DD' }} />
            </div>

            {/* Email / Password form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    color: '#2D2D2D',
                  }}
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="h-10"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    borderColor: errors.email ? undefined : '#E5E2DD',
                  }}
                  aria-invalid={!!errors.email}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-destructive" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    color: '#2D2D2D',
                  }}
                >
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="h-10"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    borderColor: errors.password ? undefined : '#E5E2DD',
                  }}
                  aria-invalid={!!errors.password}
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-xs text-destructive" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    {errors.password.message}
                  </p>
                )}
              </div>

              {error && (
                <div
                  className="rounded-lg border px-4 py-3 text-sm"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    backgroundColor: '#FEF2F2',
                    borderColor: '#FECACA',
                    color: '#DC2626',
                  }}
                >
                  {error}
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  backgroundColor: '#8B9F82',
                  color: '#FFFFFF',
                }}
                disabled={isLoading}
              >
                {isLoading ? <LoadingSpinner /> : 'Sign in'}
              </Button>
            </form>

            {/* Link to signup */}
            <p
              className="text-center text-sm"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                color: '#7A7A7A',
              }}
            >
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="font-medium underline underline-offset-4 transition-colors hover:opacity-80"
                style={{ color: '#8B9F82' }}
              >
                Create one
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function LoadingSpinner() {
  return (
    <svg
      className="size-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}
