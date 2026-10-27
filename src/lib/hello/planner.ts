// The text-a-planner: answers a couple's text using their own Altared data.
// Runs server-side with the admin client, so every query below is scoped to
// userId by hand (RLS does not apply).

import type Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAnthropic } from "@/lib/anthropic/client";
import type { Database } from "@/lib/types/database";
import type { HistoryMessage } from "./client";

type Admin = SupabaseClient<Database>;

const MODEL = "claude-sonnet-5-5";
const MAX_TOOL_ROUNDS = 6;
const DAY_MS = 24 * 60 * 60 * 1000;

// What vendors_status_check allows (VendorStatus in types/vendor.ts is out of date)
export const VENDOR_STATUSES = [
  "researching",
  "contacted",
  "quoted",
  "meeting_scheduled",
  "negotiating",
  "booked",
  "declined",
  "archived",
];

const TOOLS: Anthropic.Tool[] = [
  {
    name: "get_tasks",
    description:
      "List the couple's planning tasks. Use 'due_soon' for what's coming up (next `days` days, default 7, overdue included), 'overdue', 'open' for everything not done, or 'completed'.",
    input_schema: {
      type: "object",
      properties: {
        filter: { type: "string", enum: ["due_soon", "overdue", "open", "completed"] },
        days: { type: "integer", minimum: 1, maximum: 365 },
      },
      required: ["filter"],
    },
  },
  {
    name: "add_task",
    description: "Add a task to the couple's task list.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        due_date: { type: "string", description: "YYYY-MM-DD" },
        description: { type: "string" },
      },
      required: ["title", "due_date"],
    },
  },
  {
    name: "complete_task",
    description:
      "Mark a task done. Call get_tasks first to find its id; ask the couple if more than one task matches.",
    input_schema: {
      type: "object",
      properties: { task_id: { type: "string" } },
      required: ["task_id"],
    },
  },
  {
    name: "get_budget",
    description:
      "The couple's budget: total, committed and paid overall, plus each category's allocation, committed amount and what's left.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "log_expense",
    description:
      "Record an expense in the budget. Set paid true if the money has already gone out.",
    input_schema: {
      type: "object",
      properties: {
        description: { type: "string" },
        amount: { type: "number", minimum: 0 },
        category: { type: "string", description: "Budget category name, e.g. Florist" },
        paid: { type: "boolean" },
        vendor_name: { type: "string" },
      },
      required: ["description", "amount", "paid"],
    },
  },
  {
    name: "get_vendors",
    description:
      "List the couple's vendors with contact info, status and prices. Pass query to search by name, company or category.",
    input_schema: {
      type: "object",
      properties: { query: { type: "string" } },
    },
  },
  {
    name: "compare_vendors",
    description:
      "Side-by-side details for 2-4 of the couple's vendors, including what their scanned quotes include, payment schedules and cancellation terms. Pass vendor names as the couple said them.",
    input_schema: {
      type: "object",
      properties: {
        vendors: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 },
      },
      required: ["vendors"],
    },
  },
  {
    name: "add_vendor",
    description: "Add a vendor the couple is considering or has booked.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        category: { type: "string" },
        company_name: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        website: { type: "string" },
        status: { type: "string", enum: VENDOR_STATUSES },
        quoted_price: { type: "number", minimum: 0 },
        notes: { type: "string" },
      },
      required: ["name"],
    },
  },
];

type Profile = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  | "full_name"
  | "partner_name"
  | "wedding_name"
  | "wedding_date"
  | "wedding_location"
  | "estimated_guest_count"
  | "total_budget"
>;

function systemPrompt(profile: Profile, now: Date) {
  const details = [
    profile.full_name && `Name: ${profile.full_name}`,
    profile.partner_name && `Partner: ${profile.partner_name}`,
    profile.wedding_name && `Wedding: ${profile.wedding_name}`,
    profile.wedding_date && `Wedding date: ${profile.wedding_date}`,
    profile.wedding_location && `Location: ${profile.wedding_location}`,
    profile.estimated_guest_count && `Guests: about ${profile.estimated_guest_count}`,
    profile.total_budget && `Total budget: $${profile.total_budget}`,
  ].filter(Boolean);

  return `You are the couple's wedding planner inside Altared, talking over text message.

Today is ${now.toISOString().slice(0, 10)}.
${details.length ? details.join("\n") : "They haven't filled in their wedding details yet."}

How to reply:
- This is a text message. Keep it short: a few lines, plain text, no markdown, no headings. Short lists with "-" are fine.
- Use the tools to read or change their tasks, budget and vendors. Never invent their data.
- When you change something, confirm what you did in one line.
- If a request is ambiguous (several tasks match, no amount given), ask one short question instead of guessing.
- For general planning advice, ground it in their date, budget, guest count and vendors.
- To compare vendors, use compare_vendors, then give a clear pick or the one trade-off that decides it, based on what matters for their wedding. Don't just list numbers back.
- Notes in [square brackets] come from Altared, not the couple (for example, a photo they sent that was scanned). Act on them but never quote them.
- Some of your earlier texts were check-ins you sent on your own ("did you finish that task?"). When they answer one, follow through: mark the task done, update the vendor, or help with the next step.
- Everything you add shows up in their Altared dashboard at altared.app.`;
}

function dueDateIso(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T12:00:00Z` : new Date(date).toISOString();
}

// "hair_makeup" and "Hair & Makeup" compare equal
const normalize = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "");

/** The couple's category closest to name (theirs or a default), or null. */
export async function findCategory(db: Admin, userId: string, name?: string) {
  if (!name) return null;
  const { data } = await db
    .from("vendor_categories")
    .select("id, name")
    .or(`user_id.is.null,user_id.eq.${userId}`);
  const wanted = normalize(name);
  if (!wanted) return null;
  return (
    data?.find((c) => normalize(c.name) === wanted) ??
    data?.find((c) => normalize(c.name).includes(wanted) || wanted.includes(normalize(c.name))) ??
    null
  );
}

async function runTool(
  db: Admin,
  userId: string,
  profile: Profile,
  name: string,
  input: Record<string, unknown>,
  now: Date
): Promise<unknown> {
  switch (name) {
    case "get_tasks": {
      const filter = input.filter as string;
      let query = db
        .from("reminders")
        .select("id, title, description, due_date, is_completed, vendors(name)")
        .eq("user_id", userId)
        .order("due_date", { ascending: true })
        .limit(25);
      if (filter === "completed") {
        query = query.eq("is_completed", true);
      } else {
        query = query.eq("is_completed", false);
        if (filter === "overdue") query = query.lt("due_date", now.toISOString());
        if (filter === "due_soon") {
          const days = Number(input.days ?? 7);
          query = query.lte("due_date", new Date(now.getTime() + days * DAY_MS).toISOString());
        }
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }

    case "add_task": {
      const { data, error } = await db
        .from("reminders")
        .insert({
          user_id: userId,
          title: String(input.title),
          description: (input.description as string) ?? null,
          due_date: dueDateIso(String(input.due_date)),
          reminder_type: "custom",
          created_via: "text",
        })
        .select("id, title, due_date")
        .single();
      if (error) throw error;
      return data;
    }

    case "complete_task": {
      const { data, error } = await db
        .from("reminders")
        .update({ is_completed: true })
        .eq("id", String(input.task_id))
        .eq("user_id", userId)
        .select("id, title")
        .maybeSingle();
      if (error) throw error;
      return data ?? { error: "No task with that id" };
    }

    case "get_budget": {
      const [{ data: items, error }, { data: categories }] = await Promise.all([
        db
          .from("budget_items")
          .select("estimated_cost, actual_cost, category_id")
          .eq("user_id", userId),
        db
          .from("vendor_categories")
          .select("id, name, default_budget_percentage")
          .or(`user_id.is.null,user_id.eq.${userId}`),
      ]);
      if (error) throw error;

      const total = profile.total_budget ?? 0;
      const committed = (items ?? []).reduce((sum, i) => sum + i.estimated_cost, 0);
      const paid = (items ?? []).reduce((sum, i) => sum + (i.actual_cost ?? 0), 0);
      const byCategory = (categories ?? [])
        .map((cat) => {
          const catItems = (items ?? []).filter((i) => i.category_id === cat.id);
          const allocated = Math.round((total * (cat.default_budget_percentage ?? 0)) / 100);
          const catCommitted = catItems.reduce((sum, i) => sum + i.estimated_cost, 0);
          return {
            category: cat.name,
            allocated,
            committed: catCommitted,
            left: allocated - catCommitted,
          };
        })
        .filter((c) => c.allocated > 0 || c.committed > 0);

      return { total_budget: total, committed, paid, left: total - committed, byCategory };
    }

    case "log_expense": {
      const category = await findCategory(db, userId, input.category as string | undefined);
      let vendorId: string | null = null;
      if (input.vendor_name) {
        const { data: vendor } = await db
          .from("vendors")
          .select("id")
          .eq("user_id", userId)
          .ilike("name", `%${input.vendor_name}%`)
          .limit(1)
          .maybeSingle();
        vendorId = vendor?.id ?? null;
      }
      const amount = Number(input.amount);
      const paid = Boolean(input.paid);
      const { data, error } = await db
        .from("budget_items")
        .insert({
          user_id: userId,
          description: String(input.description),
          estimated_cost: amount,
          actual_cost: paid ? amount : 0,
          is_paid: paid,
          paid_date: paid ? now.toISOString().slice(0, 10) : null,
          category_id: category?.id ?? null,
          vendor_id: vendorId,
        })
        .select("id, description, estimated_cost, is_paid")
        .single();
      if (error) throw error;
      return { ...data, category: category?.name ?? "Uncategorized" };
    }

    case "get_vendors": {
      const { data, error } = await db
        .from("vendors")
        .select(
          "id, name, company_name, email, phone, website, status, quoted_price, final_price, deposit_amount, deposit_due_date, deposit_paid, notes, vendor_categories(name)"
        )
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      const q = (input.query as string | undefined)?.toLowerCase();
      if (!q) return data;
      return data.filter((v) =>
        [v.name, v.company_name, (v.vendor_categories as { name: string } | null)?.name]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(q))
      );
    }

    case "compare_vendors": {
      const wanted = (input.vendors as string[]).map((n) => normalize(n));
      const { data, error } = await db
        .from("vendors")
        .select(
          "id, name, company_name, status, rating, quoted_price, final_price, deposit_amount, deposit_due_date, is_booked, notes, vendor_categories(name), proposals(extracted_total_price, extracted_deposit_amount, extracted_deposit_due_date, extracted_services, extracted_payment_schedule, extracted_cancellation_policy, extracted_notes)"
        )
        .eq("user_id", userId);
      if (error) throw error;
      const matches = data.filter((v) =>
        wanted.some((w) => {
          const names = [v.name, v.company_name].filter(Boolean).map((n) => normalize(n!));
          return names.some((n) => n.includes(w) || w.includes(n));
        })
      );
      if (matches.length < 2) {
        return {
          error: "Couldn't find at least two of those vendors",
          found: matches.map((v) => v.name),
          theirVendors: data.map((v) => v.name),
        };
      }
      return matches;
    }

    case "add_vendor": {
      const category = await findCategory(db, userId, input.category as string | undefined);
      const status = VENDOR_STATUSES.includes(input.status as string)
        ? (input.status as string)
        : "researching";
      const { data, error } = await db
        .from("vendors")
        .insert({
          user_id: userId,
          name: String(input.name),
          category_id: category?.id ?? null,
          company_name: (input.company_name as string) ?? null,
          email: (input.email as string) ?? null,
          phone: (input.phone as string) ?? null,
          website: (input.website as string) ?? null,
          quoted_price: (input.quoted_price as number) ?? null,
          notes: (input.notes as string) ?? null,
          status,
          is_booked: status === "booked",
        })
        .select("id, name, status")
        .single();
      if (error) throw error;
      return { ...data, category: category?.name ?? null };
    }

    default:
      return { error: `Unknown tool ${name}` };
  }
}

/** Returns the reply to text back for the couple's latest message. */
export async function replyToCouple(
  db: Admin,
  userId: string,
  profile: Profile,
  history: HistoryMessage[],
  latestText: string,
  now = new Date()
): Promise<string> {
  // History usually already ends with the latest text; make sure it's there once,
  // and that the conversation starts with the couple (the API requires it).
  const turns = [...history];
  const last = turns[turns.length - 1];
  if (!last || last.role !== "user" || last.text !== latestText.trim()) {
    turns.push({ role: "user", text: latestText });
  }
  while (turns.length && turns[0].role !== "user") turns.shift();

  const messages: Anthropic.MessageParam[] = [];
  for (const turn of turns) {
    const prev = messages[messages.length - 1];
    // Merge back-to-back texts from the same side into one turn
    if (prev && prev.role === turn.role) {
      prev.content = `${prev.content}\n${turn.text}`;
    } else {
      messages.push({ role: turn.role, content: turn.text });
    }
  }

  const anthropic = getAnthropic();
  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt(profile, now),
      tools: TOOLS,
      messages,
    });

    if (response.stop_reason !== "tool_use") {
      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      return text || "Sorry, I didn't catch that. Could you say it another way?";
    }

    messages.push({ role: "assistant", content: response.content });
    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type !== "tool_use") continue;
      try {
        const result = await runTool(
          db,
          userId,
          profile,
          block.name,
          block.input as Record<string, unknown>,
          now
        );
        results.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify(result) });
      } catch (err) {
        console.error(`planner tool ${block.name} failed:`, err);
        results.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: "That didn't work. Tell the couple briefly and suggest the dashboard.",
          is_error: true,
        });
      }
    }
    messages.push({ role: "user", content: results });
  }

  return "That took more steps than I can handle over text. Try it in your dashboard at altared.app.";
}
