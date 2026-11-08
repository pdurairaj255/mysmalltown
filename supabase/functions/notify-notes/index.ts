// My Small Town — emails about new notes of appreciation, as each person
// chooses in Settings: "instant" (each note as it's shared), "daily" or
// "weekly" summaries, or "off" (the default).
//
// - Instant: a Database Webhook calls this on each new row in public.thanks.
// - Summaries: pg_cron posts {"type": "DIGEST", "period": "daily" | "weekly"}.
// Setup: SETUP.md, "Emails about new notes".
//
// Uses the same Edge Function secrets as notify-admin:
//   GMAIL_USER, GMAIL_APP_PASSWORD, WEBHOOK_SECRET, APP_URL
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.

import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

type Note = {
  id: string;
  group_id: string;
  author_id: string;
  recipient_id: string | null;
  recipient_name: string;
  body: string | null;
  created_at: string;
  deleted_at?: string | null;
};
// deno-lint-ignore no-explicit-any
type Db = any;

function secret(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing secret ${name}`);
  return value;
}

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

function appLink(page = "") {
  const base = secret("APP_URL");
  return new URL(page, base.endsWith("/") ? base : `${base}/`).href;
}

async function sendEmail(to: string, subject: string, text: string, html: string) {
  const gmailUser = secret("GMAIL_USER");
  // Port 465 (TLS): Supabase Edge Functions can't send on ports 25 or 587.
  const client = new SMTPClient({
    connection: {
      hostname: "smtp.gmail.com",
      port: 465,
      tls: true,
      auth: { username: gmailUser, password: secret("GMAIL_APP_PASSWORD") },
    },
  });
  try {
    await client.send({ from: `My Small Town <${gmailUser}>`, to, subject, content: text, html });
  } finally {
    await client.close();
  }
}

async function emailOf(db: Db, accountId: string): Promise<string | null> {
  const { data } = await db.auth.admin.getUserById(accountId);
  return data?.user?.email ?? null;
}

async function namesOf(db: Db, ids: string[]): Promise<Map<string, string>> {
  if (!ids.length) return new Map();
  const { data } = await db.from("profiles").select("id, display_name").in("id", [...new Set(ids)]);
  return new Map((data ?? []).map((p: { id: string; display_name: string }) => [p.id, p.display_name]));
}

async function groupNamesOf(db: Db, ids: string[]): Promise<Map<string, string>> {
  const { data } = await db.from("groups").select("id, name").in("id", [...new Set(ids)]);
  return new Map((data ?? []).map((g: { id: string; name: string }) => [g.id, g.name]));
}

// "Grace appreciated you" for the reader, otherwise names as people see them in the app.
function headline(note: Note, names: Map<string, string>, readerId: string) {
  const author = names.get(note.author_id) ?? "A former member";
  const to = note.recipient_id === readerId
    ? "you"
    : note.recipient_id ? names.get(note.recipient_id) ?? note.recipient_name : note.recipient_name;
  return { author, line: `${author} appreciated ${to}` };
}

const footer = () => ({
  text: `\n\nOpen My Small Town: ${appLink()}\nChange how often you get these emails: ${appLink("settings.html")}`,
  html: `<p style="margin-top:24px;font-size:13px;color:#4E4578"><a href="${escapeHtml(appLink())}">Open My Small Town</a> · <a href="${escapeHtml(appLink("settings.html"))}">Change how often you get these emails</a></p>`,
});

const card = (line: string, body: string) =>
  `<div style="background:#F3F0FF;border-radius:12px;padding:12px 14px;margin:10px 0"><strong>${escapeHtml(line)}</strong><p style="margin:6px 0 0;white-space:pre-line">${escapeHtml(body)}</p></div>`;

// Every account that should hear about a new note right away: people in the
// group (or parents of kids in it) who chose "instant", except the writer's own account.
async function sendInstant(db: Db, note: Note) {
  if (!note?.id || !note.body || note.deleted_at) return "Ignored";
  const [{ data: author }, { data: members }] = await Promise.all([
    db.from("profiles").select("account_id").eq("id", note.author_id).maybeSingle(),
    db.from("memberships").select("user_id").eq("group_id", note.group_id).is("left_at", null),
  ]);
  const memberIds = (members ?? []).map((m: { user_id: string }) => m.user_id);
  if (!memberIds.length) return "Nobody to tell";
  const { data: people } = await db.from("profiles").select("id, account_id").in("id", memberIds);
  const accounts = [...new Set((people ?? []).map((p: { account_id: string }) => p.account_id))]
    .filter((a) => a !== author?.account_id);
  if (!accounts.length) return "Nobody to tell";
  const { data: readers } = await db.from("profiles").select("id, notify, approved").in("id", accounts);
  const wanting = (readers ?? []).filter((r: { notify: string; approved: boolean }) => r.notify === "instant" && r.approved);
  if (!wanting.length) return "Nobody wants instant emails";

  const names = await namesOf(db, [note.author_id, note.recipient_id].filter(Boolean) as string[]);
  const groupName = (await groupNamesOf(db, [note.group_id])).get(note.group_id) ?? "your group";
  const end = footer();
  let sent = 0;
  for (const reader of wanting) {
    const email = await emailOf(db, reader.id);
    if (!email) continue;
    const { author, line } = headline(note, names, reader.id);
    await sendEmail(
      email,
      `${author} shared a note of appreciation in ${groupName}`,
      `New in ${groupName}:\n\n${line}:\n${note.body}${end.text}`,
      `<div style="font-family:system-ui,sans-serif;color:#221A47;max-width:520px"><h2 style="margin:0 0 8px">New in ${escapeHtml(groupName)}</h2>${card(line, note.body)}${end.html}</div>`,
    );
    sent++;
  }
  return `Sent ${sent}`;
}

// One summary email per account that chose this period, covering notes shared
// by others in any of their groups (or their kids' groups) since the last one.
async function sendDigests(db: Db, period: "daily" | "weekly") {
  const since = new Date(Date.now() - (period === "weekly" ? 7 : 1) * 86400000).toISOString();
  const { data: readers } = await db.from("profiles").select("id").eq("notify", period).eq("approved", true).eq("is_kid", false);
  const end = footer();
  let sent = 0;
  for (const reader of readers ?? []) {
    const { data: people } = await db.from("profiles").select("id").eq("account_id", reader.id);
    const mine = (people ?? []).map((p: { id: string }) => p.id);
    const { data: memberships } = await db.from("memberships").select("group_id").in("user_id", mine).is("left_at", null);
    const groupIds = [...new Set((memberships ?? []).map((m: { group_id: string }) => m.group_id))] as string[];
    if (!groupIds.length) continue;
    const { data: notes } = await db.from("thanks").select("*").in("group_id", groupIds).gte("created_at", since).is("deleted_at", null).order("created_at");
    const fresh = (notes ?? []).filter((n: Note) => n.body && !mine.includes(n.author_id)) as Note[];
    if (!fresh.length) continue;

    const email = await emailOf(db, reader.id);
    if (!email) continue;
    const names = await namesOf(db, fresh.flatMap((n) => [n.author_id, n.recipient_id].filter(Boolean) as string[]));
    const groupNames = await groupNamesOf(db, fresh.map((n) => n.group_id));
    const byGroup = new Map<string, Note[]>();
    for (const n of fresh) byGroup.set(n.group_id, [...(byGroup.get(n.group_id) ?? []), n]);

    let text = "";
    let html = "";
    for (const [gid, list] of byGroup) {
      const name = groupNames.get(gid) ?? "Your group";
      text += `\n${name}\n`;
      html += `<h3 style="margin:20px 0 4px">${escapeHtml(name)}</h3>`;
      for (const n of list) {
        const { line } = headline(n, names, reader.id);
        text += `\n${line}:\n${n.body}\n`;
        html += card(line, n.body as string);
      }
    }
    const count = `${fresh.length} new ${fresh.length === 1 ? "note" : "notes"} of appreciation`;
    const label = period === "weekly" ? "This week" : "Today";
    await sendEmail(
      email,
      `${label} in My Small Town: ${count}`,
      `${label} in My Small Town: ${count}\n${text}${end.text}`,
      `<div style="font-family:system-ui,sans-serif;color:#221A47;max-width:520px"><h2 style="margin:0 0 4px">${label} in My Small Town</h2><p style="margin:0;color:#4E4578">${count}</p>${html}${end.html}</div>`,
    );
    sent++;
  }
  return `Sent ${sent}`;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  // Only the webhook and the scheduled job know this; anyone else is turned away.
  if (req.headers.get("x-webhook-secret") !== secret("WEBHOOK_SECRET")) {
    return new Response("Forbidden", { status: 403 });
  }

  const payload = await req.json().catch(() => null);
  const db = createClient(secret("SUPABASE_URL"), secret("SUPABASE_SERVICE_ROLE_KEY"));

  if (payload?.type === "INSERT" && payload?.table === "thanks") {
    return new Response(await sendInstant(db, payload.record));
  }
  if (payload?.type === "DIGEST" && (payload.period === "daily" || payload.period === "weekly")) {
    return new Response(await sendDigests(db, payload.period));
  }
  return new Response("Ignored");
});
