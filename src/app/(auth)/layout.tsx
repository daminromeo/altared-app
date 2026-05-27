import type { Metadata } from "next"

// Auth utility pages (login, signup, OAuth callback) carry no search value
// and shouldn't be indexed. Applied here so it also covers client-component
// pages, which can't export metadata themselves.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
