"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LinkCode {
  sms_link: string;
  mode: "live" | "sandbox";
  project_id: string;
}

export const TEXT_EXAMPLES = [
  "What's due this week?",
  "Paid the florist $500 deposit",
  "What's left in the photography budget?",
  "Add a task to send invites by Mar 1",
  "What's the caterer's phone number?",
];

/**
 * hello's hosted connect QR (tap-to-text on phones). Texting the code links
 * the phone to the signed-in couple. Codes work once and expire in about 30
 * minutes, so a fresh one is minted each time this mounts.
 */
export function ConnectPhoneEmbed({ className = "" }: { className?: string }) {
  const [code, setCode] = useState<LinkCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const fetchCode = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetch("/api/hello/link-code", { method: "POST" });
      if (!res.ok) throw new Error();
      setCode(await res.json());
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCode();
  }, [fetchCode]);

  const embedUrl = code
    ? `https://ohhello.to/embed?${new URLSearchParams({
        sms: code.sms_link,
        mode: code.mode,
        project_id: code.project_id,
        name: "Altared planner",
      })}`
    : null;

  return (
    <div className={`flex w-full max-w-[360px] flex-col items-center gap-3 ${className}`}>
      {loading ? (
        <div className="flex h-[520px] w-full items-center justify-center rounded-lg border border-hairline">
          <Loader2 className="h-6 w-6 animate-spin text-ink-muted" />
        </div>
      ) : failed || !embedUrl ? (
        <div className="flex h-[200px] w-full flex-col items-center justify-center gap-3 rounded-lg border border-hairline text-center">
          <p className="text-sm text-ink-muted">Couldn&apos;t load your connect code.</p>
          <Button variant="outline" size="sm" onClick={fetchCode}>
            Try again
          </Button>
        </div>
      ) : (
        <>
          <iframe
            src={embedUrl}
            title="Connect your phone to your Altared planner"
            className="h-[520px] w-full max-w-[360px] rounded-lg border-0"
          />
          <button
            type="button"
            onClick={fetchCode}
            className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink"
          >
            <RefreshCw className="h-3 w-3" />
            New code (each one works once and expires in 30 minutes)
          </button>
        </>
      )}
    </div>
  );
}

/** Shown once the couple's first text has arrived. */
export function PhoneConnected({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-start gap-3 rounded-2xl bg-sage-soft p-4 text-moss ${className}`}>
      <CheckCircle2 className="mt-0.5 size-5 flex-none" />
      <div>
        <p className="font-display font-bold">Your phone is connected</p>
        <p className="mt-0.5 text-sm text-moss/80">
          Text your planner anytime. Everything you send shows up in your dashboard.
        </p>
      </div>
    </div>
  );
}

export function TextExamples({ className = "" }: { className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      <p className="font-medium text-ink">Things you can text</p>
      <ul className="space-y-2">
        {TEXT_EXAMPLES.map((example) => (
          <li key={example} className="rounded-lg border border-hairline px-3 py-2 text-sm text-ink">
            &ldquo;{example}&rdquo;
          </li>
        ))}
      </ul>
    </div>
  );
}
