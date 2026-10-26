"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { PLANS } from "@/lib/stripe/config";
import { usePortalSession, useCheckout, useSubscription } from "@/lib/hooks/use-subscription";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ShareLinkManager } from "@/components/share/share-link-manager";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProfileData {
  id: string;
  email: string;
  full_name: string | null;
  partner_name: string | null;
  wedding_name: string | null;
  wedding_date: string | null;
  wedding_location: string | null;
  total_budget: number | null;
  avatar_url: string | null;
  subscription_status: string;
  stripe_customer_id: string | null;
}

interface NotificationPrefs {
  weekly_summary: boolean;
  task_reminders: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const supabase = useMemo(() => createClient(), []);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>(
    {
      weekly_summary: true,
      task_reminders: true,
    }
  );
  const [notificationsLoading, setNotificationsLoading] = useState(true);

  const portalSession = usePortalSession();
  const checkout = useCheckout();
  const {
    data: subscriptionData,
    plan: currentPlan,
    access,
    isTrial,
    trialDaysLeft,
    trialEnded,
    hasPaidAccess,
  } = useSubscription();

  // ── Fetch profile ─────────────────────────────────────────────────────────

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      // Use maybeSingle() to avoid error when profile doesn't exist
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (data) {
        setProfile(data as ProfileData);
      } else {
        // Profile doesn't exist yet — wait for trigger, then retry
        await new Promise((r) => setTimeout(r, 500));
        const { data: retryData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (retryData) {
          setProfile(retryData as ProfileData);
        } else {
          const { data: newProfile } = await supabase
            .from("profiles")
            .upsert(
              {
                id: user.id,
                email: user.email ?? "",
                full_name: user.user_metadata?.full_name ?? null,
                subscription_status: "free",
              },
              { onConflict: "id", ignoreDuplicates: true }
            )
            .select("*")
            .single();

          if (newProfile) {
            setProfile(newProfile as ProfileData);
          }
        }
      }
    } catch (err) {
      console.error("Settings profile fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // ── Save profile ──────────────────────────────────────────────────────────

  async function handleSaveProfile() {
    if (!profile) return;

    setSaving(true);
    setSaveMessage(null);

    let avatarUrl = profile.avatar_url;

    // Upload avatar if a new file was selected
    if (avatarFile) {
      const fileExt = avatarFile.name.split(".").pop();
      const filePath = `${profile.id}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, avatarFile, { upsert: true });

      if (uploadError) {
        toast.error(`Avatar upload failed: ${uploadError.message}`);
        setSaving(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);
      avatarUrl = publicUrl;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        partner_name: profile.partner_name,
        wedding_name: profile.wedding_name,
        wedding_date: profile.wedding_date,
        wedding_location: profile.wedding_location,
        total_budget: profile.total_budget,
        avatar_url: avatarUrl,
      })
      .eq("id", profile.id);

    if (error) {
      setSaveMessage("Failed to save changes. Please try again.");
    } else {
      setSaveMessage("Changes saved successfully!");
      setProfile((p) => (p ? { ...p, avatar_url: avatarUrl } : p));
      setAvatarFile(null);
    }

    setSaving(false);
    setTimeout(() => setSaveMessage(null), 3000);
  }

  // ── Load notifications ────────────────────────────────────────────────────

  const fetchNotificationPrefs = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/notifications");
      if (res.ok) {
        const data = await res.json();
        if (data.preferences) {
          setNotificationPrefs(data.preferences);
        }
      }
    } catch {
      // Use defaults
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotificationPrefs();
  }, [fetchNotificationPrefs]);

  // ── Save notifications ────────────────────────────────────────────────────

  async function handleSaveNotifications() {
    if (!profile) return;
    setSaving(true);

    try {
      const res = await fetch("/api/settings/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notificationPrefs),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to save notification preferences");
        setSaving(false);
        return;
      }

      toast.success("Notification preferences saved!");
    } catch {
      toast.error("Failed to save notification preferences");
    }

    setSaving(false);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  function updateProfile(field: keyof ProfileData, value: string | number | null) {
    setProfile((p) => (p ? { ...p, [field]: value } : p));
  }

  function toggleNotif(key: keyof NotificationPrefs) {
    setNotificationPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  let accessSummary = "The basics: up to 10 vendors, budget tracking and 2-vendor comparison.";
  let accessBadge = "Free";
  if (access?.source === "pass" && access.accessEndsAt) {
    accessSummary = `Paid once. Full access through ${formatDate(access.accessEndsAt)}, and longer if your wedding date moves later.`;
    accessBadge = "Active";
  } else if (access?.source === "subscription") {
    accessSummary = "Your monthly subscription includes everything in the Wedding Pass.";
    accessBadge = "Subscribed";
  } else if (isTrial && access?.trialEndsAt) {
    accessSummary = `Free trial: everything is unlocked until ${formatDate(access.trialEndsAt)} (${trialDaysLeft} ${trialDaysLeft === 1 ? "day" : "days"} left).`;
    accessBadge = "Trial";
  } else if (trialEnded) {
    accessSummary = "Your free trial has ended. Everything you added is still here.";
  }
  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  // ── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#8B9F82] border-t-transparent" />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8">
      <div>
        <h1
          className="text-3xl font-bold tracking-tight text-[#2D2D2D]"
          style={{ fontFamily: "var(--font-manrope), sans-serif" }}
        >
          Settings
        </h1>
        <p className="mt-1 text-[#7A7A7A]">
          Manage your account and preferences.
        </p>
      </div>

      {saveMessage && (
        <div
          className={`rounded-lg px-4 py-3 text-sm font-medium ${
            saveMessage.includes("Failed")
              ? "bg-red-50 text-red-700"
              : "bg-[#8B9F82]/10 text-[#8B9F82]"
          }`}
        >
          {saveMessage}
        </div>
      )}

      <Tabs defaultValue="profile">
        <TabsList className="w-full justify-start gap-1 bg-[#FAF8F5]">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="sharing">Sharing</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* ── Profile Tab ────────────────────────────────────────────────── */}
        <TabsContent value="profile">
          <Card className="border-[#E8E4DF]">
            <CardHeader>
              <CardTitle className="text-[#2D2D2D]">Wedding Details</CardTitle>
              <CardDescription className="text-[#7A7A7A]">
                Update your wedding information and profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20 border-2 border-[#8B9F82]/30">
                    {profile?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.avatar_url}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <AvatarFallback className="bg-[#8B9F82]/10 text-xl font-semibold text-[#8B9F82]">
                        {initials}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <Label
                      htmlFor="avatar-upload"
                      className="cursor-pointer text-sm font-medium text-[#8B9F82] hover:underline"
                    >
                      Upload new photo
                    </Label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        setAvatarFile(e.target.files?.[0] ?? null)
                      }
                    />
                    {avatarFile && (
                      <p className="mt-1 text-xs text-[#7A7A7A]">
                        Selected: {avatarFile.name}
                      </p>
                    )}
                  </div>
                </div>

                <Separator className="bg-[#E8E4DF]" />

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Your Name</Label>
                    <Input
                      id="full_name"
                      value={profile?.full_name ?? ""}
                      onChange={(e) =>
                        updateProfile("full_name", e.target.value || null)
                      }
                      placeholder="Your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="partner_name">Partner&apos;s Name</Label>
                    <Input
                      id="partner_name"
                      value={profile?.partner_name ?? ""}
                      onChange={(e) =>
                        updateProfile("partner_name", e.target.value || null)
                      }
                      placeholder="Partner's full name"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="wedding_name">Wedding Name</Label>
                    <Input
                      id="wedding_name"
                      value={profile?.wedding_name ?? ""}
                      onChange={(e) =>
                        updateProfile("wedding_name", e.target.value || null)
                      }
                      placeholder="e.g. The Romeo Wedding"
                    />
                    <p className="text-xs text-[#7A7A7A]">
                      Displayed in your dashboard header
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wedding_date">Wedding Date</Label>
                    <Input
                      id="wedding_date"
                      type="date"
                      value={profile?.wedding_date ?? ""}
                      onChange={(e) =>
                        updateProfile("wedding_date", e.target.value || null)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wedding_location">Venue / Location</Label>
                    <Input
                      id="wedding_location"
                      value={profile?.wedding_location ?? ""}
                      onChange={(e) =>
                        updateProfile("wedding_location", e.target.value || null)
                      }
                      placeholder="Venue or city"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="total_budget">Total Budget ($)</Label>
                    <Input
                      id="total_budget"
                      type="number"
                      min={0}
                      step={100}
                      value={profile?.total_budget ?? ""}
                      onChange={(e) =>
                        updateProfile(
                          "total_budget",
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                      placeholder="e.g. 30000"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="bg-[#8B9F82] text-white hover:bg-[#7A8E71]"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Billing Tab ────────────────────────────────────────────────── */}
        <TabsContent value="billing">
          <Card className="border-[#E8E4DF]">
            <CardHeader>
              <CardTitle className="text-[#2D2D2D]">
                Subscription & Billing
              </CardTitle>
              <CardDescription className="text-[#7A7A7A]">
                Manage your plan and payment information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Plan */}
              <div className="rounded-2xl border border-moss/15 bg-sage-soft/50 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-ink-muted">Current plan</p>
                    <p className="mt-1 font-display text-2xl font-bold tracking-[-0.03em] text-ink">
                      {currentPlan.name}
                    </p>
                    <p className="mt-1 text-sm text-ink-muted">{accessSummary}</p>
                  </div>
                  <Badge className="bg-moss text-white">{accessBadge}</Badge>
                </div>

                {subscriptionData?.cancelAtPeriodEnd && subscriptionData?.currentPeriodEnd && (
                  <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                    <p className="text-sm text-amber-800">
                      Your subscription is set to cancel on{" "}
                      <span className="font-semibold">{formatDate(subscriptionData.currentPeriodEnd)}</span>
                      . You&apos;ll keep full access until then.
                    </p>
                  </div>
                )}
              </div>

              {/* Plan Features */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-ink">
                  {hasPaidAccess || isTrial ? "Included" : "The Wedding Pass includes"}
                </h3>
                <ul className="space-y-2">
                  {PLANS.pass.features.map((feature) => (
                    <li key={feature.text} className="flex items-center gap-2 text-sm text-ink">
                      <svg className="h-4 w-4 text-moss" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {feature.text}
                    </li>
                  ))}
                </ul>
              </div>

              <Separator className="bg-hairline" />

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3">
                {!hasPaidAccess && (
                  <Button
                    className="rounded-full bg-moss px-5 text-white hover:bg-moss-light"
                    disabled={checkout.isPending}
                    onClick={() => checkout.mutate({ location: "settings_billing" })}
                  >
                    {checkout.isPending
                      ? "Opening checkout…"
                      : `Get the Wedding Pass · $${PLANS.pass.price} once`}
                  </Button>
                )}

                {access?.source === "subscription" && (
                  <Button
                    variant="outline"
                    onClick={() => portalSession.mutate()}
                    disabled={portalSession.isPending}
                  >
                    {portalSession.isPending ? "Loading..." : "Manage subscription"}
                  </Button>
                )}

                {profile?.stripe_customer_id && (
                  <Button
                    variant="ghost"
                    onClick={() => portalSession.mutate()}
                    disabled={portalSession.isPending}
                    className="text-ink-muted"
                  >
                    View billing history
                  </Button>
                )}
              </div>
              {checkout.isError && (
                <p role="alert" className="text-sm text-error">
                  Checkout didn&apos;t open: {checkout.error.message}. Try again in a moment.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Sharing Tab ───────────────────────────────────────────────── */}
        <TabsContent value="sharing">
          <ShareLinkManager />
        </TabsContent>

        {/* ── Notifications Tab ──────────────────────────────────────────── */}
        <TabsContent value="notifications">
          <Card className="border-[#E8E4DF]">
            <CardHeader>
              <CardTitle className="text-[#2D2D2D]">
                Email Notifications
              </CardTitle>
              <CardDescription className="text-[#7A7A7A]">
                Choose which emails you&apos;d like to receive.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Weekly Summary */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[#2D2D2D]">Weekly Summary</p>
                  <p className="text-sm text-[#7A7A7A]">
                    A weekly digest of your vendor activity, budget changes, and upcoming deadlines.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={notificationPrefs.weekly_summary}
                  onClick={() => toggleNotif("weekly_summary")}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    notificationPrefs.weekly_summary
                      ? "bg-[#8B9F82]"
                      : "bg-[#E8E4DF]"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition-transform ${
                      notificationPrefs.weekly_summary
                        ? "translate-x-5"
                        : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <Separator className="bg-[#E8E4DF]" />

              {/* Task Reminders */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[#2D2D2D]">Task Reminders</p>
                  <p className="text-sm text-[#7A7A7A]">
                    Get notified about upcoming deposit due dates and payment deadlines.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={notificationPrefs.task_reminders}
                  onClick={() => toggleNotif("task_reminders")}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    notificationPrefs.task_reminders
                      ? "bg-[#8B9F82]"
                      : "bg-[#E8E4DF]"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition-transform ${
                      notificationPrefs.task_reminders
                        ? "translate-x-5"
                        : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleSaveNotifications}
                  disabled={saving}
                  className="bg-[#8B9F82] text-white hover:bg-[#7A8E71]"
                >
                  {saving ? "Saving..." : "Save Preferences"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Support */}
      <Card className="border-[#E8E4DF]">
        <CardContent className="flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-[#2D2D2D]">Need help?</p>
            <p className="text-sm text-[#7A7A7A]">
              Reach out to us anytime and we&apos;ll get back to you as soon as possible.
            </p>
          </div>
          <a
            href="mailto:altaredapp@gmail.com"
            className="text-sm font-medium text-[#8B9F82] hover:underline"
          >
            altaredapp@gmail.com
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
