"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Link2,
  Copy,
  Check,
  Trash2,
  Plus,
  Loader2,
  Clock,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UpgradePrompt } from "@/components/upgrade-prompt";
import { useSubscription } from "@/lib/hooks/use-subscription";
import { toast } from "sonner";

interface ShareLink {
  id: string;
  token: string;
  partner_name: string | null;
  is_active: boolean;
  expires_at: string | null;
  last_accessed_at: string | null;
  created_at: string;
  shareUrl: string;
}

export function ShareLinkManager() {
  const { canUseFeature } = useSubscription();
  const canShare = canUseFeature("partner_sharing");

  const [links, setLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    try {
      const res = await fetch("/api/share");
      if (res.ok) {
        const data = await res.json();
        setLinks(data.links ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canShare) fetchLinks();
    else setLoading(false);
  }, [canShare, fetchLinks]);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        if (body?.error === "upgrade_required") {
          toast.error("Upgrade to Pro to share your wedding plans");
          return;
        }
        toast.error("Failed to generate share link");
        return;
      }

      const data = await res.json();
      toast.success("Share link created!");
      copyToClipboard(data.shareUrl, data.link.id);
      fetchLinks();
    } catch {
      toast.error("Failed to generate share link");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    try {
      const res = await fetch("/api/share", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        toast.success("Link revoked");
        setLinks((prev) =>
          prev.map((l) => (l.id === id ? { ...l, is_active: false } : l))
        );
      }
    } catch {
      toast.error("Failed to revoke link");
    }
  }

  function copyToClipboard(url: string, id: string) {
    navigator.clipboard.writeText(url);
    setCopied(id);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(null), 2000);
  }

  const activeLink = links.find((l) => l.is_active);
  const inactiveLinks = links.filter((l) => !l.is_active);

  // ── Free plan gate ─────────────────────────────────────────────────────────

  if (!canShare) {
    return (
      <Card className="border-[#E8E4DF]">
        <CardHeader>
          <CardTitle className="text-[#2D2D2D]">Sharing</CardTitle>
          <CardDescription className="text-[#7A7A7A]">
            Share a read-only view of your wedding plans with your partner, family, or wedding planner.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UpgradePrompt
            title="Sharing"
            description="Let your partner, parents, friends, or wedding planner browse vendors, view your budget, and leave reactions — all without needing an account."
            compact
          />
        </CardContent>
      </Card>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Card className="border-[#E8E4DF]">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[#8B9F82]" />
        </CardContent>
      </Card>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Card className="border-[#E8E4DF]">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-[#2D2D2D]">Sharing</CardTitle>
            <CardDescription className="text-[#7A7A7A]">
              Generate a magic link to share a read-only view with your
              partner, family, or wedding planner. They can browse vendors,
              view your budget, and leave reactions.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Active Link */}
        {activeLink ? (
          <div className="space-y-3 rounded-lg border border-[#8B9F82]/30 bg-[#8B9F82]/5 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-[#8B9F82]" />
                <span className="text-sm font-medium text-[#2D2D2D]">
                  Active Share Link
                </span>
                <Badge className="bg-[#8B9F82] text-white">Active</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  className="h-8 px-2 text-[#7A7A7A] hover:text-[#2D2D2D]"
                  onClick={() =>
                    copyToClipboard(activeLink.shareUrl, activeLink.id)
                  }
                >
                  {copied === activeLink.id ? (
                    <Check className="h-4 w-4 text-[#8B9F82]" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  className="h-8 px-2 text-red-500 hover:text-red-700"
                  onClick={() => handleRevoke(activeLink.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="rounded-md bg-white px-3 py-2">
              <code className="break-all text-xs text-[#7A7A7A]">
                {activeLink.shareUrl}
              </code>
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-[#7A7A7A]">
              {activeLink.partner_name && (
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  Viewed by {activeLink.partner_name}
                </span>
              )}
              {activeLink.last_accessed_at && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last accessed{" "}
                  {new Date(activeLink.last_accessed_at).toLocaleDateString()}
                </span>
              )}
              {activeLink.expires_at && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Expires{" "}
                  {new Date(activeLink.expires_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[#E8E4DF] p-8 text-center">
            <Link2 className="mx-auto h-8 w-8 text-[#7A7A7A]/50" />
            <p className="mt-3 text-sm text-[#7A7A7A]">
              No active share link. Generate one to share with others.
            </p>
            <Button
              onClick={handleCreate}
              disabled={creating}
              className="mt-4 bg-[#8B9F82] text-white hover:bg-[#7A8E71]"
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Generate Share Link
                </>
              )}
            </Button>
          </div>
        )}

        {/* Generate new (when active exists) */}
        {activeLink && (
          <Button
            onClick={handleCreate}
            disabled={creating}
            variant="outline"
            className="w-full"
          >
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating new link...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Generate New Link (revokes current)
              </>
            )}
          </Button>
        )}

        {/* Previous links */}
        {inactiveLinks.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-[#7A7A7A]">
              Previous Links
            </p>
            <div className="space-y-2">
              {inactiveLinks.slice(0, 5).map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between rounded-md border border-[#E8E4DF] px-3 py-2 text-xs text-[#7A7A7A]"
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="border-[#E8E4DF] text-[#7A7A7A]"
                    >
                      Revoked
                    </Badge>
                    {link.partner_name && (
                      <span>Viewed by {link.partner_name}</span>
                    )}
                  </div>
                  <span>
                    {new Date(link.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
