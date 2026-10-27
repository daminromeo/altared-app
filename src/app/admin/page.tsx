"use client";

import { useEffect, useState } from "react";

interface AdminMetrics {
  overview: {
    totalUsers: number;
    completedOnboarding: number;
    subscriptionBreakdown: { free: number; pro: number; premium: number; pass: number };
    mrr: number;
  };
  signupsByDay: Record<string, number>;
  engagement: {
    totalVendors: number;
    bookedVendors: number;
    totalProposals: number;
    scannedProposals: number;
    totalTasks: number;
    completedTasks: number;
    totalPartnerShares: number;
    activePartnerShares: number;
  };
  users: Array<{
    id: string;
    email: string;
    full_name: string | null;
    subscription_status: string;
    onboarding_completed: boolean;
    created_at: string;
    wedding_date: string | null;
    estimated_guest_count: number | null;
    total_budget: number | null;
    has_stripe: boolean;
    vendor_count: number;
    proposal_count: number;
    task_count: number;
  }>;
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <p className="text-sm text-ink-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink">{value}</p>
      {sub && <p className="mt-1 text-xs text-ink-muted">{sub}</p>}
    </div>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, string> = {
    free: "bg-gray-100 text-gray-600",
    pro: "bg-champagne/15 text-brass",
    premium: "bg-moss/15 text-moss",
    pass: "bg-moss/15 text-moss",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[plan] ?? colors.free}`}
    >
      {plan}
    </span>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"overview" | "users">("overview");

  useEffect(() => {
    fetch("/api/admin/metrics")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-moss border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-ink-muted">
        Failed to load metrics.
      </div>
    );
  }

  const { overview, signupsByDay, engagement, users } = data;

  // Signup chart (simple bar chart)
  const days = Object.entries(signupsByDay).slice(-14); // last 14 days
  const maxSignups = Math.max(...days.map(([, v]) => v), 1);

  // Filtered users
  const filteredUsers = users
    .filter(
      (u) =>
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.full_name ?? "").toLowerCase().includes(search.toLowerCase())
    )
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1
          className="text-2xl font-bold text-ink"
          style={{ fontFamily: "var(--font-manrope), sans-serif" }}
        >
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Overview of all users and platform activity
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-white p-1 border border-border w-fit">
        {(["overview", "users"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-moss/10 text-moss"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            {t === "overview" ? "Overview" : "Users"}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          {/* Overview cards */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Total Users" value={overview.totalUsers} />
            <StatCard
              label="Completed Onboarding"
              value={overview.completedOnboarding}
              sub={`${overview.totalUsers > 0 ? Math.round((overview.completedOnboarding / overview.totalUsers) * 100) : 0}% completion rate`}
            />
            <StatCard
              label="Paying Couples"
              value={
                overview.subscriptionBreakdown.pass +
                overview.subscriptionBreakdown.pro +
                overview.subscriptionBreakdown.premium
              }
              sub={`${overview.subscriptionBreakdown.pass} Wedding Pass, ${overview.subscriptionBreakdown.pro + overview.subscriptionBreakdown.premium} legacy monthly`}
            />
            <StatCard
              label="Est. MRR"
              value={`$${overview.mrr.toFixed(2)}`}
            />
          </div>

          {/* Signup chart */}
          <div className="rounded-xl border border-border bg-white p-6">
            <h2 className="text-sm font-medium text-ink">
              Signups (Last 14 Days)
            </h2>
            <div className="mt-4 flex items-end gap-1.5" style={{ height: 120 }}>
              {days.map(([day, count]) => (
                <div
                  key={day}
                  className="group relative flex flex-1 flex-col items-center"
                >
                  <div
                    className="w-full rounded-t bg-moss transition-all hover:bg-moss/80"
                    style={{
                      height: `${Math.max((count / maxSignups) * 100, 4)}%`,
                      minHeight: count > 0 ? 8 : 2,
                    }}
                  />
                  <span className="mt-1 text-[9px] text-ink-muted">
                    {new Date(day + "T12:00:00").toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  {/* Tooltip */}
                  <div className="pointer-events-none absolute -top-8 rounded bg-ink px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {count} signup{count !== 1 ? "s" : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subscription breakdown */}
          <div className="rounded-xl border border-border bg-white p-6">
            <h2 className="text-sm font-medium text-ink">
              Subscription Breakdown
            </h2>
            <div className="mt-4 space-y-3">
              {(
                [
                  ["Free", overview.subscriptionBreakdown.free, "bg-gray-300"],
                  ["Wedding Pass", overview.subscriptionBreakdown.pass, "bg-moss"],
                  ["Pro", overview.subscriptionBreakdown.pro, "bg-champagne"],
                  [
                    "Premium",
                    overview.subscriptionBreakdown.premium,
                    "bg-moss",
                  ],
                ] as const
              ).map(([label, count, color]) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="w-16 text-sm text-ink-muted">{label}</span>
                  <div className="flex-1 rounded-full bg-gray-100 h-3">
                    <div
                      className={`h-3 rounded-full ${color} transition-all`}
                      style={{
                        width: `${overview.totalUsers > 0 ? (count / overview.totalUsers) * 100 : 0}%`,
                        minWidth: count > 0 ? 12 : 0,
                      }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm font-medium text-ink">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Engagement metrics */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard
              label="Vendors Added"
              value={engagement.totalVendors}
              sub={`${engagement.bookedVendors} booked`}
            />
            <StatCard
              label="Proposals Scanned"
              value={engagement.scannedProposals}
              sub={`${engagement.totalProposals} total uploaded`}
            />
            <StatCard
              label="Tasks Created"
              value={engagement.totalTasks}
              sub={`${engagement.completedTasks} completed`}
            />
            <StatCard
              label="Partner Shares"
              value={engagement.totalPartnerShares}
              sub={`${engagement.activePartnerShares} active`}
            />
          </div>
        </>
      )}

      {tab === "users" && (
        <div className="space-y-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-border bg-white px-4 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-moss/30"
          />

          {/* User count */}
          <p className="text-xs text-ink-muted">
            {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}
          </p>

          {/* Users table */}
          <div className="overflow-x-auto rounded-xl border border-border bg-white">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-paper">
                  <th className="px-4 py-3 font-medium text-ink-muted">
                    User
                  </th>
                  <th className="px-4 py-3 font-medium text-ink-muted">
                    Plan
                  </th>
                  <th className="px-4 py-3 font-medium text-ink-muted">
                    Onboarded
                  </th>
                  <th className="px-4 py-3 font-medium text-ink-muted">
                    Vendors
                  </th>
                  <th className="px-4 py-3 font-medium text-ink-muted">
                    Proposals
                  </th>
                  <th className="px-4 py-3 font-medium text-ink-muted">
                    Tasks
                  </th>
                  <th className="px-4 py-3 font-medium text-ink-muted">
                    Wedding Date
                  </th>
                  <th className="px-4 py-3 font-medium text-ink-muted">
                    Signed Up
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-border last:border-0 hover:bg-paper/50"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-ink">
                          {u.full_name || "—"}
                        </p>
                        <p className="text-xs text-ink-muted">{u.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <PlanBadge plan={u.subscription_status} />
                    </td>
                    <td className="px-4 py-3">
                      {u.onboarding_completed ? (
                        <span className="text-moss">Yes</span>
                      ) : (
                        <span className="text-[#C4A0A0]">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink">
                      {u.vendor_count}
                    </td>
                    <td className="px-4 py-3 text-ink">
                      {u.proposal_count}
                    </td>
                    <td className="px-4 py-3 text-ink">
                      {u.task_count}
                    </td>
                    <td className="px-4 py-3 text-ink">
                      {u.wedding_date
                        ? new Date(u.wedding_date + "T12:00:00").toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" }
                          )
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {new Date(u.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-ink-muted"
                    >
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
