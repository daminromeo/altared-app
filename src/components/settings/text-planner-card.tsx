"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface LinkCode {
  sms_link: string;
  mode: "live" | "sandbox";
  project_id: string;
}

const EXAMPLES = [
  "What's due this week?",
  "Paid the florist $500 deposit",
  "What's left in the photography budget?",
  "Add a task to send invites by Mar 1",
  "What's the caterer's phone number?",
];

/** hello's hosted QR (tap-to-text on phones) that links the couple's phone to their account. */
export function TextPlannerCard() {
  const [code, setCode] = useState<LinkCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  // Codes expire in ~30 minutes, so mint one whenever the tab opens
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
    <Card className="border-hairline">
      <CardHeader>
        <CardTitle className="text-ink">Text your planner</CardTitle>
        <CardDescription className="text-ink-muted">
          Scan the code with your phone (or tap it on mobile) and send the text that opens. After
          that, text your planner anytime to update tasks, budget and vendors.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 md:flex-row md:items-start">
        <div className="flex w-full max-w-[360px] shrink-0 flex-col items-center gap-3">
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

        <div className="space-y-3">
          <p className="font-medium text-ink">Things you can text</p>
          <ul className="space-y-2">
            {EXAMPLES.map((example) => (
              <li
                key={example}
                className="rounded-lg border border-hairline px-3 py-2 text-sm text-ink"
              >
                &ldquo;{example}&rdquo;
              </li>
            ))}
          </ul>
          <p className="text-sm text-ink-muted">
            Anything you add by text shows up here in your dashboard.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
