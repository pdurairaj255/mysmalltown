# Setting up My Small Town for your family

The app stores its data and sends sign-in emails through **Supabase** (free plan). Setup takes about 15 minutes, once.

Until it's connected, the app runs in **demo mode**: everything stays on the device you're using, so it's good for trying things out but not for a family to share.

## 1. Create the Supabase project

1. Sign up at [supabase.com](https://supabase.com) and click **New project**.
2. Pick any name (for example `my-small-town`), set a database password (save it somewhere safe; the app doesn't need it), choose the region closest to you, and create the project.

## 2. Create the tables

1. In the project, open **SQL Editor → New query**.
2. Paste the whole contents of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**. It should say "Success. No rows returned."

This creates the tables and the privacy rules: people can only see groups they belong to, and the people in those groups.

## 3. Set up sign-in emails

1. Open **Authentication → Sign In / Providers** and make sure **Email** is enabled. Turn **Confirm email** on.
2. Open **Authentication → Emails → Templates → Magic Link**, and replace the message body with:

   ```html
   <h2>Your My Small Town sign-in code</h2>
   <p>Enter this code in the app: <strong style="font-size: 24px; letter-spacing: 4px">{{ .Token }}</strong></p>
   <p>Or <a href="{{ .ConfirmationURL }}">tap here to sign in</a> on this device.</p>
   ```

   The code matters for people who install the app on their phone: links in emails open in the browser, not in the installed app, so they type the code instead.

3. Open **Authentication → URL Configuration**:
   - **Site URL**: the app's address, for example `https://pdurairaj255.github.io/mysmalltown/`
   - **Redirect URLs**: add `https://pdurairaj255.github.io/mysmalltown/**` and, for testing on your computer, `http://localhost:5173/**`

> **Email limits.** Supabase's built-in email service only sends a few emails per hour, which is fine while a handful of family members sign in once each. If people hit "rate limit" errors, connect a free email service such as [Resend](https://resend.com) under **Authentication → Emails → SMTP Settings**.

## 4. Connect the app

1. Open **Project Settings → API** (or **API Keys**).
2. Copy the **Project URL** and the **anon public** key (newer projects call it the **publishable** key).
3. Paste them into [`js/config.js`](js/config.js):

   ```js
   export const SUPABASE_URL = 'https://abcdefgh.supabase.co';
   export const SUPABASE_ANON_KEY = 'eyJhbGciOi...';
   ```

   This key is designed to be public. The privacy rules from step 2 are what keep each group's data private, so it's safe to commit even in a public repository. Never put the **service_role** or **secret** key in the app.

4. Commit and push. Once the site updates, the demo banner disappears.

## 5. Invite your family

1. Open the app, sign in with your email, and pick your name and color.
2. Tap **Start a group**, name it, and choose a town name and color.
3. On the **Groups** tab, tap **Share link** (or **Copy link**) and send it to your family. They sign in with their own email, and the link fills in the invite code for them.
4. To install it on a phone: on iPhone, open the link in Safari and tap **Share → Add to Home Screen**. On Android, open it in Chrome and tap **⋮ → Install app**.

## How the town grows

- Weeks run Monday to Sunday. When at least two-thirds of the group shares a thank-you in a week, the next piece of the current building goes up on Sunday night (52 pieces in all).
- A quiet week still adds a tree or flowers. The town never goes backward.
- Visiting on 3 or more days in a week lights a streetlight.
- Thank-yous to people outside the group bring visitors that week.
- Each person can share one thank-you per day in each group.
