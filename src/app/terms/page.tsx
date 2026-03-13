import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - Altared",
};

export default function TermsOfServicePage() {
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
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-[#7A7A7A]">
          Last updated: March 13, 2026
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-[#4A4A4A]">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#2D2D2D]">
              1. Agreement to Terms
            </h2>
            <p>
              By accessing or using Altared (&quot;the Service&quot;), available
              at altared.app, you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#2D2D2D]">
              2. Description of Service
            </h2>
            <p>
              Altared is a wedding planning platform that helps users manage
              vendors, track budgets, scan proposals, and organize wedding
              planning tasks. The Service is provided on a freemium basis with
              optional paid subscription plans.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#2D2D2D]">
              3. Account Registration
            </h2>
            <p>
              To use the Service, you must create an account with a valid email
              address. You are responsible for maintaining the security of your
              account credentials and for all activity that occurs under your
              account. You must notify us immediately of any unauthorized use.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#2D2D2D]">
              4. Subscription Plans & Billing
            </h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Free Plan:</strong> Provides access to core features
                with usage limits as described on our pricing page.
              </li>
              <li>
                <strong>Paid Plans (Pro & Premium):</strong> Offer additional
                features and higher limits. Paid plans are billed on a monthly
                or yearly basis through Stripe.
              </li>
              <li>
                <strong>Cancellation:</strong> You may cancel your subscription
                at any time through the billing settings. Upon cancellation, you
                will retain access to paid features until the end of your current
                billing period.
              </li>
              <li>
                <strong>Refunds:</strong> Subscription fees are generally
                non-refundable. If you believe you have been charged in error,
                please contact us.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#2D2D2D]">
              5. Acceptable Use
            </h2>
            <p>You agree not to:</p>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>
                Use the Service for any unlawful purpose or in violation of any
                applicable laws
              </li>
              <li>
                Attempt to gain unauthorized access to any part of the Service
              </li>
              <li>
                Upload content that is harmful, offensive, or infringes on the
                rights of others
              </li>
              <li>
                Interfere with or disrupt the integrity or performance of the
                Service
              </li>
              <li>
                Use automated systems (bots, scrapers) to access the Service
                without permission
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#2D2D2D]">
              6. Your Content
            </h2>
            <p>
              You retain ownership of all content you upload to the Service
              (vendor information, proposals, budget data, etc.). By using the
              Service, you grant us a limited license to store, process, and
              display your content solely for the purpose of providing the
              Service to you.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#2D2D2D]">
              7. Shared Links
            </h2>
            <p>
              The Service allows you to generate share links that give others
              read-only access to your wedding planning data. You are responsible
              for managing who has access to your share links. You can revoke
              share links at any time through your settings.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#2D2D2D]">
              8. AI Features
            </h2>
            <p>
              Certain features of the Service use artificial intelligence to scan
              and extract information from uploaded proposals. While we strive
              for accuracy, AI-generated results may contain errors. You should
              always verify extracted data before relying on it for financial or
              contractual decisions.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#2D2D2D]">
              9. Limitation of Liability
            </h2>
            <p>
              The Service is provided &quot;as is&quot; and &quot;as
              available&quot; without warranties of any kind, either express or
              implied. To the fullest extent permitted by law, Altared shall not
              be liable for any indirect, incidental, special, consequential, or
              punitive damages, including but not limited to loss of data, loss
              of profits, or business interruption.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#2D2D2D]">
              10. Termination
            </h2>
            <p>
              We reserve the right to suspend or terminate your account if you
              violate these Terms. You may delete your account at any time by
              contacting us. Upon termination, your data will be deleted in
              accordance with our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#2D2D2D]">
              11. Changes to Terms
            </h2>
            <p>
              We may modify these Terms at any time. We will notify you of
              material changes by posting the updated terms on this page and
              updating the &quot;Last updated&quot; date. Continued use of the
              Service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#2D2D2D]">
              12. Governing Law
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with
              the laws of the United States, without regard to conflict of law
              principles.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[#2D2D2D]">
              13. Contact Us
            </h2>
            <p>
              If you have any questions about these Terms, please contact us at{" "}
              <a
                href="mailto:support@altared.app"
                className="text-[#8B9F82] underline underline-offset-4"
              >
                support@altared.app
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
