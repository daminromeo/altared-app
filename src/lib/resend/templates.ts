import { resend } from "./client";

const FROM_EMAIL = "Altared <noreply@altared.app>";

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

function baseLayout(content: string): string {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Altared";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://altared.app";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
          }
          .container {
            background-color: #ffffff;
            border-radius: 12px;
            padding: 32px;
            border: 1px solid #e5e7eb;
          }
          .header {
            text-align: center;
            margin-bottom: 24px;
          }
          .logo {
            font-size: 24px;
            font-weight: 700;
            color: #1a1a1a;
            text-decoration: none;
          }
          .button {
            display: inline-block;
            background-color: #8B9F82;
            color: #ffffff !important;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            margin: 16px 0;
          }
          .footer {
            text-align: center;
            margin-top: 32px;
            font-size: 12px;
            color: #6b7280;
          }
          .stat-card {
            background-color: #f9fafb;
            border-radius: 8px;
            padding: 16px;
            margin: 8px 0;
          }
          .stat-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .stat-value {
            font-size: 20px;
            font-weight: 700;
            color: #2D2D2D;
            margin-top: 4px;
          }
          .task-item {
            padding: 12px 16px;
            border-left: 4px solid #d97706;
            background-color: #FFFBEB;
            border-radius: 4px;
            margin: 8px 0;
          }
          .task-item.urgent {
            border-left-color: #dc2626;
            background-color: #FEF2F2;
          }
          h1 { font-size: 20px; margin-bottom: 16px; }
          p { margin: 8px 0; color: #374151; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <a href="${appUrl}" class="logo">${appName}</a>
          </div>
          ${content}
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
          <p>You received this email because you have an account on ${appName}.
          <a href="${appUrl}/settings">Manage notification preferences</a>.</p>
        </div>
      </body>
    </html>
  `;
}

// ── Welcome Email ──────────────────────────────────────────────────────────

interface WelcomeEmailParams {
  to: string;
  name: string;
}

export async function sendWelcomeEmail({ to, name }: WelcomeEmailParams) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://altared.app";

  const html = baseLayout(`
    <h1>Welcome to Altared, ${name}!</h1>
    <p>We're thrilled to help you manage your wedding vendors and budget in one place.</p>
    <p>Here's what you can do to get started:</p>
    <ul>
      <li><strong>Add your vendors</strong> &mdash; Keep track of every vendor, from photographers to florists.</li>
      <li><strong>Upload proposals</strong> &mdash; Our AI will extract key details automatically.</li>
      <li><strong>Track your budget</strong> &mdash; See exactly where your money is going.</li>
      <li><strong>Set reminders</strong> &mdash; Never miss a payment deadline or follow-up.</li>
    </ul>
    <div style="text-align: center;">
      <a href="${appUrl}/dashboard" class="button">Go to Dashboard</a>
    </div>
    <p>If you have any questions, just reply to this email. We're here to help!</p>
  `);

  return sendEmail({
    to,
    subject: "Welcome to Altared! Let's plan your perfect day",
    html,
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
    dueDate: string;
    amount?: number;
  }>;
  recentVendors: Array<{
    name: string;
    status: string;
  }>;
}

export async function sendWeeklySummary({
  to,
  name,
  vendorCount,
  bookedCount,
  totalBudget,
  totalSpent,
  upcomingDeadlines,
  recentVendors,
}: WeeklySummaryData) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://altared.app";

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  const deadlinesHtml = upcomingDeadlines.length > 0
    ? upcomingDeadlines
        .map(
          (d) => `
          <div class="task-item">
            <p style="margin: 0; font-weight: 600;">${d.vendorName}</p>
            <p style="margin: 4px 0 0 0; font-size: 14px;">${d.description} &mdash; ${d.dueDate}${d.amount ? ` (${formatCurrency(d.amount)})` : ""}</p>
          </div>`
        )
        .join("")
    : '<p style="color: #6b7280;">No upcoming deadlines this week. You\'re all set!</p>';

  const recentVendorsHtml = recentVendors.length > 0
    ? recentVendors
        .map(
          (v) => `<li><strong>${v.name}</strong> &mdash; ${v.status}</li>`
        )
        .join("")
    : '<li style="color: #6b7280;">No new vendor activity this week.</li>';

  const budgetPercent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const html = baseLayout(`
    <h1>Your Weekly Summary</h1>
    <p>Hi ${name}, here's your wedding planning recap for this week.</p>

    <div style="display: flex; gap: 12px; margin: 20px 0;">
      <div class="stat-card" style="flex: 1;">
        <div class="stat-label">Vendors</div>
        <div class="stat-value">${vendorCount}</div>
        <div style="font-size: 12px; color: #6b7280;">${bookedCount} booked</div>
      </div>
      <div class="stat-card" style="flex: 1;">
        <div class="stat-label">Budget Used</div>
        <div class="stat-value">${budgetPercent}%</div>
        <div style="font-size: 12px; color: #6b7280;">${formatCurrency(totalSpent)} of ${formatCurrency(totalBudget)}</div>
      </div>
    </div>

    <h2 style="font-size: 16px; margin-top: 24px;">Upcoming Deadlines</h2>
    ${deadlinesHtml}

    <h2 style="font-size: 16px; margin-top: 24px;">Recent Vendor Activity</h2>
    <ul>${recentVendorsHtml}</ul>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${appUrl}/dashboard" class="button">View Dashboard</a>
    </div>
  `);

  return sendEmail({
    to,
    subject: `Your Altared Weekly Summary — ${vendorCount} vendors, ${budgetPercent}% budget used`,
    html,
  });
}

// ── Task Reminder Email ────────────────────────────────────────────────────

interface TaskReminderData {
  to: string;
  name: string;
  tasks: Array<{
    vendorName: string;
    description: string;
    dueDate: string;
    daysUntilDue: number;
    amount?: number;
  }>;
}

export async function sendTaskReminder({
  to,
  name,
  tasks,
}: TaskReminderData) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://altared.app";

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  const tasksHtml = tasks
    .map((task) => {
      const isUrgent = task.daysUntilDue <= 3;
      const dueText =
        task.daysUntilDue <= 0
          ? "Due today"
          : task.daysUntilDue === 1
            ? "Due tomorrow"
            : `Due in ${task.daysUntilDue} days`;

      return `
        <div class="task-item${isUrgent ? " urgent" : ""}">
          <p style="margin: 0; font-weight: 600;">${task.vendorName}</p>
          <p style="margin: 4px 0 0 0; font-size: 14px;">
            ${task.description}${task.amount ? ` — ${formatCurrency(task.amount)}` : ""}
          </p>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: ${isUrgent ? "#dc2626" : "#d97706"}; font-weight: 600;">
            ${dueText} (${task.dueDate})
          </p>
        </div>`;
    })
    .join("");

  const html = baseLayout(`
    <h1>Upcoming Task Reminders</h1>
    <p>Hi ${name}, you have ${tasks.length} upcoming ${tasks.length === 1 ? "task" : "tasks"} that need your attention.</p>

    ${tasksHtml}

    <div style="text-align: center; margin-top: 24px;">
      <a href="${appUrl}/vendors" class="button">View Vendors</a>
    </div>
    <p style="font-size: 13px; color: #6b7280;">You can manage your reminders in your Altared dashboard settings.</p>
  `);

  const urgentCount = tasks.filter((t) => t.daysUntilDue <= 3).length;
  const subjectPrefix = urgentCount > 0 ? "Action needed: " : "";

  return sendEmail({
    to,
    subject: `${subjectPrefix}${tasks.length} upcoming ${tasks.length === 1 ? "deadline" : "deadlines"} for your wedding`,
    html,
  });
}
