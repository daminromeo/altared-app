import { resend } from "./client";

const FROM_EMAIL = "Altared <noreply@altared.app>";

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? "https://altared.app";

// The site's palette (globals.css). Email clients ignore CSS variables and
// most <style> blocks, so everything below is inline and table-based.
const C = {
  paper: "#F6F3EE",
  ink: "#1C221E",
  muted: "#5D665F",
  moss: "#2F4A3B",
  sage: "#8B9F82",
  sageSoft: "#E4EADF",
  champagneSoft: "#F3E8CF",
  hairline: "#E3E1DC",
  flag: "#A3541F",
  flagSoft: "#F7E6DA",
};
const DISPLAY = "Manrope, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const BODY = "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: SendEmailParams) {
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });
}

const money = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);

// ── Building blocks ─────────────────────────────────────────────────────────

function heading(title: string, accent?: string) {
  return `<h1 style="margin:0 0 14px;font-family:${DISPLAY};font-size:26px;line-height:1.12;font-weight:800;letter-spacing:-0.03em;color:${C.ink};">${title}${
    accent ? `<br><span style="color:${C.moss};">${accent}</span>` : ""
  }</h1>`;
}

function paragraph(html: string, extra = "") {
  return `<p style="margin:0 0 14px;font-family:${BODY};font-size:15px;line-height:1.6;color:${C.muted};${extra}">${html}</p>`;
}

function sectionLabel(text: string) {
  return `<p style="margin:22px 0 8px;font-family:${BODY};font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${C.muted};">${text}</p>`;
}

function button(href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 6px;"><tr>
    <td style="border-radius:999px;background:${C.moss};">
      <a href="${href}" style="display:inline-block;padding:14px 28px;font-family:${DISPLAY};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;">${label}</a>
    </td></tr></table>`;
}

interface DueRow {
  title: string;
  detail?: string;
  /** e.g. "Nov 3" */
  month: string;
  day: string;
  soon: boolean;
}

/** Rows like the dashboard's "Next up": a date badge, the item, and a flag when it's close. */
function dueList(rows: DueRow[]) {
  const items = rows
    .map(
      (r, i) => `<tr>
      <td style="padding:12px 0;${i ? `border-top:1px solid ${C.hairline};` : ""}width:52px;vertical-align:middle;">
        <div style="width:44px;border-radius:12px;background:${C.sageSoft};padding:5px 0;text-align:center;font-family:${BODY};font-size:10px;font-weight:700;text-transform:uppercase;line-height:1.2;color:${C.moss};">
          ${r.month}<br><span style="font-family:${DISPLAY};font-size:16px;">${r.day}</span>
        </div>
      </td>
      <td style="padding:12px 0 12px 12px;${i ? `border-top:1px solid ${C.hairline};` : ""}vertical-align:middle;font-family:${BODY};">
        <div style="font-size:15px;font-weight:600;color:${C.ink};">${r.title}</div>
        ${r.detail ? `<div style="font-size:13px;color:${C.muted};margin-top:2px;">${r.detail}</div>` : ""}
      </td>
      <td style="padding:12px 0;${i ? `border-top:1px solid ${C.hairline};` : ""}vertical-align:middle;text-align:right;white-space:nowrap;">
        ${
          r.soon
            ? `<span style="display:inline-block;border-radius:999px;background:${C.flagSoft};padding:3px 9px;font-family:${BODY};font-size:11px;font-weight:700;color:${C.flag};">Soon</span>`
            : ""
        }
      </td>
    </tr>`
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${items}</table>`;
}

function statTiles(tiles: { label: string; value: string; detail?: string }[]) {
  const cells = tiles
    .map(
      (t, i) => `<td width="${Math.floor(100 / tiles.length)}%" style="${i ? "padding-left:10px;" : ""}vertical-align:top;">
      <div style="border-radius:16px;background:${C.paper};padding:14px 16px;">
        <div style="font-family:${BODY};font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${C.muted};">${t.label}</div>
        <div style="font-family:${DISPLAY};font-size:22px;font-weight:800;letter-spacing:-0.02em;color:${C.ink};margin-top:4px;">${t.value}</div>
        ${t.detail ? `<div style="font-family:${BODY};font-size:12px;color:${C.muted};margin-top:2px;">${t.detail}</div>` : ""}
      </div>
    </td>`
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 4px;"><tr>${cells}</tr></table>`;
}

/** For couples who haven't connected a phone: the same reminders, by text. */
function textNudge() {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:26px;"><tr>
    <td style="border-radius:18px;background:${C.moss};padding:18px 20px;">
      <div style="font-family:${DISPLAY};font-size:16px;font-weight:800;color:#F1EFE8;">Rather get these by text?</div>
      <div style="font-family:${BODY};font-size:14px;line-height:1.5;color:#C9D3C6;margin-top:4px;">Connect your phone and your planner texts you when something's due. Text back to mark it done.</div>
      <a href="${appUrl()}/dashboard" style="display:inline-block;margin-top:12px;border-radius:999px;background:#E2C994;padding:9px 18px;font-family:${DISPLAY};font-size:13px;font-weight:700;color:${C.ink};text-decoration:none;">Connect your phone</a>
    </td></tr></table>`;
}

/** The page every email shares: paper ground, wordmark, white card, quiet footer. */
function layout(content: string, { preheader = "" }: { preheader?: string } = {}) {
  const url = appUrl();
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=Manrope:wght@700;800&display=swap" rel="stylesheet" />
  </head>
  <body style="margin:0;padding:0;background:${C.paper};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.paper};">
      <tr><td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
          <tr><td style="padding:0 4px 18px;">
            <a href="${url}" style="font-family:${DISPLAY};font-size:22px;font-weight:800;letter-spacing:-0.045em;color:${C.ink};text-decoration:none;">altared<span style="color:${C.sage};">.</span></a>
          </td></tr>
          <tr><td style="background:#ffffff;border-radius:24px;border:1px solid ${C.hairline};padding:32px 28px;">
            ${content}
          </td></tr>
          <tr><td style="padding:20px 4px 0;font-family:${BODY};font-size:12px;line-height:1.6;color:${C.muted};">
            You're getting this because you have an Altared account.
            <a href="${url}/settings" style="color:${C.muted};text-decoration:underline;">Change which emails you get</a>.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function badgeDate(date: Date) {
  return {
    month: date.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
    day: date.toLocaleDateString("en-US", { day: "numeric", timeZone: "UTC" }),
  };
}

// ── Welcome Email ──────────────────────────────────────────────────────────

interface WelcomeEmailParams {
  to: string;
  name: string;
}

export function renderWelcomeEmail({ name }: Omit<WelcomeEmailParams, "to">) {
  return layout(
    `${heading(`Welcome, ${name}.`, "Your plan starts here.")}
    ${paragraph("Altared keeps your vendors, quotes, budget and to-dos in one calm plan. A few good first steps:")}
    ${dueList([
      { title: "Add your first quote", detail: "Upload it or text a photo. We pull out the full cost, fees included.", month: "Step", day: "1", soon: false },
      { title: "Set your budget", detail: "See what's left in every category as you book.", month: "Step", day: "2", soon: false },
      { title: "Connect your phone", detail: "Then text your planner updates instead of logging in.", month: "Step", day: "3", soon: false },
    ])}
    ${button(`${appUrl()}/dashboard`, "Go to your dashboard")}
    ${paragraph("Questions? Just reply to this email.", "margin-top:18px;font-size:13px;")}`,
    { preheader: "Your vendors, quotes and budget in one calm plan." }
  );
}

export async function sendWelcomeEmail({ to, name }: WelcomeEmailParams) {
  return sendEmail({
    to,
    subject: "Welcome to Altared",
    html: renderWelcomeEmail({ name }),
  });
}

// ── Weekly Summary Email ───────────────────────────────────────────────────

interface WeeklySummaryData {
  to: string;
  name: string;
  vendorCount: number;
  bookedCount: number;
  totalBudget: number;
  totalSpent: number;
  upcomingDeadlines: Array<{
    vendorName: string;
    description: string;
    /** ISO date (YYYY-MM-DD) */
    dueDate: string;
    amount?: number;
  }>;
  recentVendors: Array<{
    name: string;
    status: string;
  }>;
}

export function renderWeeklySummary({
  name,
  vendorCount,
  bookedCount,
  totalBudget,
  totalSpent,
  upcomingDeadlines,
  recentVendors,
}: Omit<WeeklySummaryData, "to">) {
  const now = Date.now();
  const deadlines = upcomingDeadlines.length
    ? dueList(
        upcomingDeadlines.map((d) => {
          const due = new Date(`${d.dueDate}T12:00:00Z`);
          return {
            title: d.vendorName,
            detail: `${d.description}${d.amount ? ` · ${money(d.amount)}` : ""}`,
            ...badgeDate(due),
            soon: due.getTime() - now < 4 * 24 * 60 * 60 * 1000,
          };
        })
      )
    : paragraph("Nothing due in the next two weeks.");

  const recent = recentVendors.length
    ? recentVendors
        .map(
          (v) =>
            `<div style="font-family:${BODY};font-size:15px;color:${C.ink};padding:6px 0;"><b>${v.name}</b> <span style="color:${C.muted};">· ${v.status}</span></div>`
        )
        .join("")
    : "";

  return layout(
    `${heading(`Your week, ${name}.`)}
    ${statTiles([
      { label: "Vendors", value: String(vendorCount), detail: `${bookedCount} booked` },
      totalBudget > 0
        ? { label: "Spent", value: money(totalSpent), detail: `of ${money(totalBudget)}` }
        : { label: "Budget", value: "Not set", detail: "Set it in your dashboard" },
    ])}
    ${sectionLabel("Due in the next two weeks")}
    ${deadlines}
    ${recent ? `${sectionLabel("New this week")}${recent}` : ""}
    ${button(`${appUrl()}/dashboard`, "Open your dashboard")}
    ${textNudge()}`,
    { preheader: upcomingDeadlines.length ? `${upcomingDeadlines.length} due in the next two weeks.` : "Your planning week at a glance." }
  );
}

export async function sendWeeklySummary(data: WeeklySummaryData) {
  const due = data.upcomingDeadlines.length;
  return sendEmail({
    to: data.to,
    subject: due ? `Your week: ${due} ${due === 1 ? "thing" : "things"} due soon` : "Your wedding planning week",
    html: renderWeeklySummary(data),
  });
}

// ── Task Reminder Email ────────────────────────────────────────────────────

interface TaskReminderData {
  to: string;
  name: string;
  tasks: Array<{
    /** Vendor or budget line; "General" for a task with no vendor */
    vendorName: string;
    description: string;
    /** ISO date (YYYY-MM-DD) */
    dueDate: string;
    daysUntilDue: number;
    amount?: number;
    /** A payment (deposit or budget line) rather than a to-do */
    isPayment?: boolean;
  }>;
}

function dueIn(days: number) {
  if (days <= 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

export function renderTaskReminder({ name, tasks }: Omit<TaskReminderData, "to">) {
  const onlyPayments = tasks.every((t) => t.isPayment);
  const rows = tasks.map((t) => {
    const title = t.isPayment ? `${t.vendorName} · ${t.description}` : t.description;
    const parts = [
      dueIn(t.daysUntilDue),
      t.amount ? money(t.amount) : null,
      !t.isPayment && t.vendorName !== "General" ? t.vendorName : null,
    ].filter(Boolean);
    return {
      title,
      detail: parts.join(" · "),
      ...badgeDate(new Date(`${t.dueDate}T12:00:00Z`)),
      soon: t.daysUntilDue <= 3,
    };
  });

  const soonest = tasks[0];
  const lead =
    tasks.length === 1
      ? `${dueIn(soonest.daysUntilDue).replace("Due", "This is due")}.`
      : `${tasks.length} things are coming up.`;

  return layout(
    `${heading(
      `Hi ${name},`,
      onlyPayments
        ? tasks.length === 1
          ? "a payment is coming up."
          : "payments are coming up."
        : "here's what's coming up."
    )}
    ${(() => {
      const followUp = tasks.some((t) => t.daysUntilDue > 1) ? "We'll remind you again the day before." : "";
      const text = onlyPayments && tasks.length > 1 ? followUp : `${lead} ${followUp}`.trim();
      return text ? paragraph(text) : "";
    })()}
    ${dueList(rows)}
    ${
      onlyPayments
        ? button(`${appUrl()}/budget`, "View your budget")
        : button(`${appUrl()}/tasks`, "View your tasks")
    }
    ${textNudge()}`,
    { preheader: rows.map((r) => r.title).join(" · ") }
  );
}

export async function sendTaskReminder(data: TaskReminderData) {
  const { tasks } = data;
  const first = tasks[0];
  const firstTitle = first.isPayment ? `${first.vendorName} ${first.description.toLowerCase()}` : first.description;
  const subject =
    tasks.length === 1
      ? `${dueIn(first.daysUntilDue)}: ${firstTitle}`
      : `${tasks.length} things coming up, starting with ${firstTitle}`;
  return sendEmail({ to: data.to, subject, html: renderTaskReminder(data) });
}

// ── Trial Ending Email ─────────────────────────────────────────────────────

interface TrialEndingData {
  to: string;
  name: string;
  /** Which email in the sequence: four days left, or the last day */
  stage: "day10" | "day13";
  trialEndsAt: string;
  price: number;
  vendorCount: number;
  quoteCount: number;
  openTaskCount: number;
}

export function renderTrialEnding({
  name,
  stage,
  trialEndsAt,
  price,
  vendorCount,
  quoteCount,
  openTaskCount,
}: Omit<TrialEndingData, "to">) {
  const endDate = new Date(trialEndsAt).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "America/New_York",
  });

  const saved = statTiles([
    { label: "Vendors", value: String(vendorCount) },
    { label: "Quotes", value: String(quoteCount) },
    { label: "Open tasks", value: String(openTaskCount) },
  ]);
  const savedBlock =
    vendorCount + quoteCount + openTaskCount > 0
      ? `${sectionLabel("Saved in your plan")}${saved}`
      : paragraph(
          "You haven't added a quote yet. Before the trial ends, upload one (or text a photo of it) and see its full cost, fees included. It takes a minute."
        );

  const keeps = [
    "Every vendor, quote and budget line",
    "Texting your planner, plus quote scanning and comparison",
    "Your planning timeline and deposit reminders",
    "Your partner's share link and reactions",
  ]
    .map(
      (k) =>
        `<div style="font-family:${BODY};font-size:15px;color:${C.ink};padding:5px 0;"><span style="color:${C.moss};font-weight:700;">✓</span>&nbsp; ${k}</div>`
    )
    .join("");

  return layout(
    `${heading(
      stage === "day10" ? "4 days left" : "Your trial ends tomorrow.",
      stage === "day10" ? "in your free trial." : undefined
    )}
    ${paragraph(
      `Hi ${name}, your free trial ends ${stage === "day10" ? "on" : "tomorrow,"} ${endDate}. After that, Altared is locked until you get the Wedding Pass. Nothing you've added is deleted, and it's all there the moment you do.`
    )}
    ${savedBlock}
    ${sectionLabel("The Wedding Pass keeps")}
    ${keeps}
    ${button(`${appUrl()}/pass?from=email_${stage}`, `Get the Wedding Pass · $${price}`)}
    ${paragraph("One payment. No subscription. Lasts through your wedding.", "font-size:13px;")}`,
    { preheader: `Your trial ends ${endDate}. Everything you've added stays saved.` }
  );
}

export async function sendTrialEnding(data: TrialEndingData) {
  return sendEmail({
    to: data.to,
    subject: data.stage === "day10" ? "4 days left in your Altared trial" : "Your Altared trial ends tomorrow",
    html: renderTrialEnding(data),
  });
}
