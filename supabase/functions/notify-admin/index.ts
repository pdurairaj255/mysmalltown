// My Small Town — email the administrator when someone signs up.
//
// A Supabase Database Webhook calls this whenever a new row is added to
// public.profiles (someone finished choosing their name and avatar), and
// this emails ADMIN_EMAIL through Gmail so you know to approve them.
// Setup: SETUP.md, "Email alerts for new sign-ups".
//
// Secrets (Edge Functions → Secrets):
//   ADMIN_EMAIL         where alerts go
//   GMAIL_USER          the Gmail address that sends them
//   GMAIL_APP_PASSWORD  that account's 16-letter app password
//   WEBHOOK_SECRET      any long random string; the webhook sends it too
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

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  // Only the webhook knows this; anyone else calling the function is turned away.
  if (req.headers.get("x-webhook-secret") !== secret("WEBHOOK_SECRET")) {
    return new Response("Forbidden", { status: 403 });
  }

  const payload = await req.json().catch(() => null);
  const profile = payload?.record;
  if (payload?.type !== "INSERT" || payload?.table !== "profiles" || !profile?.id) {
    return new Response("Ignored");
  }
  if (profile.approved) return new Response("Already approved");

  const supabaseUrl = secret("SUPABASE_URL");
  const admin = createClient(supabaseUrl, secret("SUPABASE_SERVICE_ROLE_KEY"));
  const { data } = await admin.auth.admin.getUserById(profile.id);
  const email = data?.user?.email ?? "(email unavailable)";
  const name = String(profile.display_name ?? "Someone").slice(0, 40);
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
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
    await client.send({
      from: `My Small Town <${gmailUser}>`,
      to: secret("ADMIN_EMAIL"),
      subject: `${name} is waiting for approval`,
      content: text,
      html,
    });
  } finally {
    await client.close();
  }
  return new Response("Sent");
});
