// My Small Town — account emails, sent through Gmail.
//
// A Supabase Database Webhook calls this whenever public.profiles changes:
// - New profile (someone finished choosing their name and avatar): emails
//   ADMIN_EMAIL so you know to approve them.
// - Profile changes from not approved to approved: emails that person to say
//   they're in. Other edits, like a new name or avatar, send nothing.
// Setup: SETUP.md, "Email alerts for new sign-ups".
//
// Secrets (Edge Functions → Secrets):
//   ADMIN_EMAIL         where sign-up alerts go
//   GMAIL_USER          the Gmail address that sends them
//   GMAIL_APP_PASSWORD  that account's 16-letter app password
//   WEBHOOK_SECRET      any long random string; the webhook sends it too
//   APP_URL             the app's address, linked in the approval email
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.

import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

function secret(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing secret ${name}`);
  return value;
}

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

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

async function emailOf(userId: string): Promise<string | null> {
  const admin = createClient(secret("SUPABASE_URL"), secret("SUPABASE_SERVICE_ROLE_KEY"));
  const { data } = await admin.auth.admin.getUserById(userId);
  return data?.user?.email ?? null;
}

const nameOf = (profile: { display_name?: string }) => String(profile.display_name ?? "Someone").slice(0, 40);

// Tells the administrator someone is waiting.
async function alertAdmin(profile: { id: string; display_name?: string }) {
  const email = (await emailOf(profile.id)) ?? "(email unavailable)";
  const name = nameOf(profile);
  const projectRef = new URL(secret("SUPABASE_URL")).hostname.split(".")[0];
  const sqlEditor = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;
  const approveSql = `update public.profiles set approved = true where id = '${profile.id}';`;
  const declineSql = `select public.delete_account_by_email('${email.replace(/'/g, "''")}');`;

  const text = [
    `${name} (${email}) just signed up for My Small Town and is waiting for your approval.`,
    "",
    `To approve them, open the SQL Editor (${sqlEditor}) and run:`,
    approveSql,
    "",
    "Only approve people you recognize. To turn the request down instead, run:",
    declineSql,
  ].join("\n");

  const code = 'style="display:block;background:#F3F0FF;padding:10px 12px;border-radius:8px;font-family:monospace;font-size:13px;white-space:pre-wrap"';
  const html = `
    <div style="font-family:system-ui,sans-serif;color:#221A47;max-width:520px">
      <h2 style="margin:0 0 12px">${escapeHtml(name)} is waiting for approval</h2>
      <p><strong>${escapeHtml(name)}</strong> (${escapeHtml(email)}) just signed up for My Small Town.</p>
      <p>To approve them, open the <a href="${sqlEditor}">SQL Editor</a> and run:</p>
      <code ${code}>${escapeHtml(approveSql)}</code>
      <p>Only approve people you recognize. To turn the request down instead, run:</p>
      <code ${code}>${escapeHtml(declineSql)}</code>
    </div>`;

  await sendEmail(secret("ADMIN_EMAIL"), `${name} is waiting for approval`, text, html);
}

// Tells someone their account is ready.
async function welcome(profile: { id: string; display_name?: string }) {
  const email = await emailOf(profile.id);
  if (!email) throw new Error(`No email found for approved profile ${profile.id}`);
  const name = nameOf(profile);
  const appUrl = secret("APP_URL");

  const text = [
    `Hi ${name},`,
    "",
    "Your My Small Town account has been approved, so you're ready to start.",
    "",
    `Open the app: ${appUrl}`,
    "",
    "Start a group, or join one with the invite code or link someone sent you. If the app is still showing the \"Almost there\" screen, tap Check again.",
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,sans-serif;color:#221A47;max-width:520px">
      <h2 style="margin:0 0 12px">You're in, ${escapeHtml(name)}!</h2>
      <p>Your My Small Town account has been approved, so you're ready to start.</p>
      <p><a href="${escapeHtml(appUrl)}" style="display:inline-block;background:#FFD23F;color:#221A47;font-weight:700;padding:12px 20px;border-radius:12px;text-decoration:none">Open My Small Town</a></p>
      <p>Start a group, or join one with the invite code or link someone sent you. If the app is still showing the "Almost there" screen, tap <strong>Check again</strong>.</p>
    </div>`;

  await sendEmail(email, "You're approved for My Small Town", text, html);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  // Only the webhook knows this; anyone else calling the function is turned away.
  if (req.headers.get("x-webhook-secret") !== secret("WEBHOOK_SECRET")) {
    return new Response("Forbidden", { status: 403 });
  }

  const payload = await req.json().catch(() => null);
  const profile = payload?.record;
  if (payload?.table !== "profiles" || !profile?.id) return new Response("Ignored");

  // Kids have no email of their own and follow their parent's approval.
  if (profile.is_kid) return new Response("Ignored");

  if (payload.type === "INSERT" && !profile.approved) {
    await alertAdmin(profile);
    return new Response("Sent");
  }
  if (payload.type === "UPDATE" && profile.approved && payload.old_record?.approved === false) {
    await welcome(profile);
    return new Response("Sent");
  }
  return new Response("Ignored");
});
