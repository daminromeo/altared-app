import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Altared",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Header */}
      <header className="border-b border-[#E8E4DF]/60 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-lg font-bold text-[#8B9F82]"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            Altared
          </Link>
          <Link
            href="/"
            className="text-sm text-[#7A7A7A] transition-colors hover:text-[#2D2D2D]"
          >
            &larr; Back to home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1
          className="text-3xl font-bold text-[#2D2D2D]"
          style={{ fontFamily: "var(--font-playfair), serif" }}
        >
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-[#7A7A7A]">
          Last updated: March 13, 2026
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-[#4A4A4A]">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#2D2D2D]">
              1. Introduction
            </h2>
            <p>
              Altared (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;)
              operates the Altared wedding planning platform available at
              altared.app. This Privacy Policy explains how we collect, use,
              disclose, and safeguard your information when you use our service.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#2D2D2D]">
              2. Information We Collect
            </h2>
            <h3 className="mb-2 font-semibold text-[#2D2D2D]">
              Account Information
            </h3>
            <p>
              When you create an account, we collect your name, email address,
              and any profile information you choose to provide (such as wedding
              date, partner name, and venue location).
            </p>
            <h3 className="mb-2 mt-4 font-semibold text-[#2D2D2D]">
              Wedding Planning Data
            </h3>
            <p>
              We store vendor information, budget details, proposals, tasks, and
              other wedding planning data you enter into the platform. This data
              is associated with your account and used solely to provide you with
              the service.
            </p>
            <h3 className="mb-2 mt-4 font-semibold text-[#2D2D2D]">
              Payment Information
            </h3>
            <p>
              Payments are processed by Stripe. We do not store your credit card
              number or full payment details on our servers. We retain your
              Stripe customer ID and subscription status to manage your plan.
            </p>
            <h3 className="mb-2 mt-4 font-semibold text-[#2D2D2D]">
              Usage Data
            </h3>
            <p>
              We may collect information about how you access and use the
              service, including your IP address, browser type, device
              information, pages visited, and timestamps.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#2D2D2D]">
              3. How We Use Your Information
            </h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>To provide, maintain, and improve the Altared platform</li>
              <li>To process transactions and manage your subscription</li>
              <li>
                To send you service-related communications (such as task
                reminders and weekly summaries, which you can opt out of)
              </li>
              <li>
                To enable features you use, such as AI-powered proposal scanning
                and shared links
              </li>
              <li>To detect, prevent, and address technical issues</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#2D2D2D]">
              4. Sharing of Information
            </h2>
            <p>We do not sell your personal information. We may share your information with:</p>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>
                <strong>Service providers:</strong> Third-party services that
                help us operate the platform (e.g., Supabase for data storage,
                Stripe for payments, Resend for email delivery)
              </li>
              <li>
                <strong>Shared links:</strong> If you create a share link, the
                recipients of that link can view the vendor, budget, and planning
                information you choose to share. No account is required for
                recipients.
              </li>
              <li>
                <strong>Legal requirements:</strong> If required by law,
                regulation, or legal process
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#2D2D2D]">
              5. Data Security
            </h2>
            <p>
              We implement appropriate technical and organizational measures to
              protect your personal information. Your data is stored securely
              using Supabase with row-level security policies. However, no method
              of transmission over the Internet is 100% secure, and we cannot
              guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#2D2D2D]">
              6. Data Retention
            </h2>
            <p>
              We retain your account data for as long as your account is active.
              If you delete your account, we will delete your personal data
              within 30 days, except where we are required to retain it for legal
              or compliance purposes.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#2D2D2D]">
              7. Your Rights
            </h2>
            <p>You have the right to:</p>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>Access and receive a copy of your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>
                Opt out of marketing communications and notification emails
              </li>
            </ul>
            <p className="mt-2">
              To exercise any of these rights, please contact us at the email
              below.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#2D2D2D]">
              8. Cookies
            </h2>
            <p>
              We use essential cookies to maintain your authentication session.
              We do not use third-party advertising or tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#2D2D2D]">
              9. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify
              you of any material changes by posting the new policy on this page
              and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#2D2D2D]">
              10. Contact Us
            </h2>
            <p>
              If you have any questions about this Privacy Policy, please contact
              us at{" "}
              <a
                href="mailto:altaredapp@gmail.com"
                className="text-[#8B9F82] underline underline-offset-4"
              >
                altaredapp@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E8E4DF]/60 bg-white">
        <div className="mx-auto max-w-3xl px-6 py-6 text-center text-sm text-[#7A7A7A]">
          &copy; {new Date().getFullYear()} Altared. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
