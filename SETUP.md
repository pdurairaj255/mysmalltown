# Setting up My Small Town for your family

The app stores its data and sends sign-in emails through **Supabase** (free plan). Setup takes about 15 minutes, once.

Until it's connected, the app runs in **demo mode**: everything stays on the device you're using, so it's good for trying things out but not for a family to share.

## 1. Create the Supabase project

1. Sign up at [supabase.com](https://supabase.com) and click **New project**.
2. Pick any name (for example `my-small-town`), set a database password (save it somewhere safe; the app doesn't need it), choose the region closest to you, and create the project.

## 2. Create the tables

1. In the project, open **SQL Editor → New query**.
2. Paste the whole contents of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**. It should say "Success. No rows returned."

This creates the tables and the privacy rules: people can only see groups they belong to, and the people in those groups, and nobody can do anything until you approve their account.

> **Already ran an earlier version of the schema?** Don't run `schema.sql` again. Instead, run each update you haven't run yet, in order, each in its own new query. All are safe to run more than once:
>
> 1. [`supabase/migrations/002_approval_and_invite_codes.sql`](supabase/migrations/002_approval_and_invite_codes.sql): avatars, account approval and longer invite codes.
> 2. [`supabase/migrations/003_delete_my_account.sql`](supabase/migrations/003_delete_my_account.sql): lets people delete their own account without shrinking anyone's town.
> 3. [`supabase/migrations/004_kid_profiles.sql`](supabase/migrations/004_kid_profiles.sql): kid profiles under a parent's account.
> 4. [`supabase/migrations/005_three_notes_a_day.sql`](supabase/migrations/005_three_notes_a_day.sql): up to 3 notes of appreciation per day.
> 5. [`supabase/migrations/006_delete_town.sql`](supabase/migrations/006_delete_town.sql): lets a group's owner delete its town.

## 3. Set up sign-in emails

1. Open **Authentication → Sign In / Providers** and make sure **Email** is enabled. Turn **Confirm email** on.
2. Open **Authentication → Emails → Templates**. Someone signing in for the very first time gets the **Confirm signup** email, and returning people get **Magic Link**. In **both** templates, replace the message body with:

   ```html
   <h2>Your My Small Town sign-in code</h2>
   <p>Enter this code in the app: <strong style="font-size: 24px; letter-spacing: 4px">{{ .Token }}</strong></p>
   <p>Keep the app open while you get this email, then type the code there. It works once and expires in about an hour.</p>
   ```

   These emails deliberately have a code and no link. Links open in the browser rather than an installed app, and some email services test links automatically, which uses up the one-time sign-in before the person gets to it. If the code stops working, that's usually why.

3. Open **Authentication → URL Configuration**:
   - **Site URL**: the app's address, for example `https://mysmalltown.pages.dev` (see step 4d)
   - **Redirect URLs**: add `https://mysmalltown.pages.dev/**` and, for testing on your computer, `http://localhost:5173/**`

> **Email limits.** Supabase's built-in email service only sends a few emails per hour, which is fine while a handful of family members sign in once each. If people hit "rate limit" errors, connect a free email service such as [Resend](https://resend.com) under **Authentication → Emails → SMTP Settings**.

## 4. Connect the app to your Supabase project

Right now the app doesn't know your Supabase project exists, so it runs in demo mode. This step gives it two pieces of information, like an address and a door key, so it can find your project and talk to it.

### 4a. Copy the two values from Supabase

1. In your Supabase project, click the **gear icon (Project Settings)** at the bottom of the left sidebar.
2. Click **Data API**. Copy the **Project URL**. It looks like `https://abcdefghijkl.supabase.co`.
3. Click **API Keys**. Copy the **anon public** key: a long string that starts with `eyJ`. (Some newer projects show a **Publishable key** starting with `sb_publishable_` instead; that works the same way.)

> These two values are meant to be public: anyone using the app gets them anyway. Your data stays private because of the rules you added in step 2.
> On the same page there's also a **service_role** or **secret** key. **Never copy that one** into the app or share it with anyone. It bypasses all the privacy rules.

### 4b. Put them in the app

**Easiest:** paste both values to Claude in the chat, and Claude will put them in the app and publish the update.

**Or do it yourself:**

1. Open the file `js/config.js` in the My Small Town folder with Notepad (right-click → Open with → Notepad).
2. It has two lines with empty quotes:

   ```js
   export const SUPABASE_URL = '';
   export const SUPABASE_ANON_KEY = '';
   ```

   Paste each value between its pair of quotes, so it looks like this (with your own values):

   ```js
   export const SUPABASE_URL = 'https://abcdefghijkl.supabase.co';
   export const SUPABASE_ANON_KEY = 'eyJhbGciOi...the rest of the long key...';
   ```

3. Save the file, then commit and push it to GitHub (GitHub Desktop or `git push`) so the live site gets the change.

### 4c. Check it worked

Open the app. If the dark **"Demo mode"** strip at the top is gone and the sign-in page says **"Email me a sign-in code"**, the app is connected.

## 4d. Put the app online (Cloudflare Pages, free)

This gives the app a web address your family can open on any phone or computer. It works with a private GitHub repo, adds no badge or toolbar, and every time a change is pushed to GitHub, the site updates by itself within a minute or two.

1. Go to [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up) and create a free account.
2. In the left sidebar, open **Workers & Pages** (under **Compute**) and click **Create application**. Cloudflare points you toward Workers first: choose **Pages** (it may be a small link reading **Get started** next to "Looking to deploy Pages?"), then **Import an existing Git repository**.
3. Click **Connect GitHub**. When GitHub asks for access, choose **Only select repositories**, pick `mysmalltown`, and approve. Back in Cloudflare, select the repo and click **Begin setup**.
4. Fill in the settings:
   - **Project name:** this becomes your address. `mysmalltown` gives `https://mysmalltown.pages.dev` (Cloudflare adds a few letters if the name is taken).
   - **Production branch:** `main`
   - **Framework preset:** None
   - **Build command:** leave empty
   - **Build output directory:** `/`
5. Click **Save and Deploy**, then wait for it to finish.
6. Tell Supabase about the address: **Authentication → URL Configuration**.
   - **Site URL:** your address, for example `https://mysmalltown.pages.dev`
   - **Redirect URLs:** add the same address followed by `/**`, for example `https://mysmalltown.pages.dev/**`
7. Open the address on your phone and sign in to check it works.

If Cloudflare set the project up as a Worker instead of Pages, your address ends in `workers.dev`, like `https://mysmalltown.yourname.workers.dev`. That works just the same: use that address in step 6.

The address is public, but that's all a stranger gets: the sign-in page. Nobody sees anything until you approve them, and search engines are told not to list the site. Settings live in two files in the repo: [`_headers`](_headers) and [`_redirects`](_redirects).

### Moving from Netlify

Your data lives in Supabase, so nothing is lost in the move. Do these steps once the Cloudflare address works:

1. Send your family the new address. Each person signs in once with an emailed code, because sign-ins are saved per address.
2. Anyone who installed the app on their phone should delete the old icon and add the new address to their home screen.
3. In Supabase, go to **Authentication → URL Configuration**. Make sure **Site URL** is the new address, and remove the old `netlify.app` address from **Redirect URLs**. Until you do, sign-in emails can still link to the old site.
4. In Netlify, delete the site: **Site configuration → General → Danger zone → Delete this site**.
5. In GitHub, remove Netlify's access: **Settings → Applications → Installed GitHub Apps → Netlify → Configure → Uninstall**.

## 5. Approve yourself, then invite your family

1. Open the app, sign in with your email, and pick your name and townsperson (40 avatars: kids, teens, adults and grandparents). You'll land on an **"Almost there"** screen, because every new account, yours included, needs approval.
2. Approve yourself (see **Approving people** below), then tap **Check again** in the app.
3. Tap **Start a group**, name it, and choose a town name and color.
4. On the **Groups** tab, tap **Share link** (or **Copy link**) and send it to your family. They sign in with their own email, pick their avatar, and wait for you to approve them. Once approved, the link fills in the invite code for them.
5. To install it on a phone: on iPhone, open the link in Safari and tap **Share → Add to Home Screen**. On Android, open it in Chrome and tap **⋮ → Install app**.

## Kid profiles

Kids don't need an email. A parent adds them from **Groups → Kid profiles** (or **Who's using the app?**): name, avatar, and which of the parent's groups to join. Each kid has their own daily note of appreciation, visits, surprises and place in town.

- **More groups later:** to add a kid to another of your groups, go to **Who's using the app?**, tap **Edit** next to them, and tick the group. A kid in several groups switches between them on the **Groups** tab, the same as anyone else.
- **Sharing a device:** when an account has kids, the app asks **"Who's using the app?"** each time it's opened. Everyone taps their own townsperson, with no sign-in codes. The **Using as … · Switch** chip on Home switches at any time.
- **Approval:** kids follow their parent's approval, so you approve the parent once.
- **Removing a kid:** the parent taps **Remove** next to them. Like deleting an account, the town stays exactly as built, and only the kid's name, avatar and note text are erased. Deleting a parent's account removes their kids the same way.
- An account can have up to 10 kids.

## Approving people

New accounts can't see, create or join anything until you approve them. The database enforces this, so it can't be skipped from the app.

**To see who's waiting**, run this in **SQL Editor → New query**:

```sql
select u.email, p.display_name, p.created_at
from public.profiles p
join auth.users u on u.id = p.id
where not p.approved
order by p.created_at;
```

**To approve someone**, put their email in this and run it:

```sql
update public.profiles set approved = true
where id = (select id from auth.users where email = 'their.email@example.com');
```

Or, without SQL: **Table Editor → profiles**, find the person by name, double-click their **approved** cell, choose **TRUE**, and save.

**To remove someone's access** later, run the same update with `approved = false`. They immediately lose access to every group, though their past notes of appreciation stay.

## Email alerts for new sign-ups

Two automatic emails, both sent through Gmail using the same kind of app password as your sign-in emails:

- **To you:** when someone signs up and is waiting for approval, with their name and email and the exact line to run to approve them.
- **To them:** when you approve them, however you do it (SQL or Table Editor), with a link to the app. Kid profiles don't get one, since they have no email of their own.

> **Already set up the sign-up alert?** Do these three things: paste the latest [`index.ts`](supabase/functions/notify-admin/index.ts) over the code in **Edge Functions → notify-admin → Code** and click **Deploy**; add the `APP_URL` secret from step 3; and edit the webhook from step 4 so **Update** is ticked too.

### 1. Make a webhook secret

This is a long random password that only Supabase knows. It stops anyone else from triggering alert emails. To make one, run this in a terminal on your computer:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy what it prints. You'll paste it in two places below. Don't share it.

### 2. Add the alert code

1. In Supabase, open **Edge Functions → Deploy a new function → Via Editor**.
2. Name it exactly `notify-admin`.
3. Replace the sample code with the whole contents of [`supabase/functions/notify-admin/index.ts`](supabase/functions/notify-admin/index.ts), then click **Deploy**.
4. Open the function's **Details** (or **Settings**) and turn **off** **Enforce JWT verification**. The webhook secret protects it instead.

### 3. Add its secrets

Open **Edge Functions → Secrets** and add these five:

| Name | Value |
| --- | --- |
| `ADMIN_EMAIL` | where you want alerts sent |
| `GMAIL_USER` | the Gmail address that sends them |
| `GMAIL_APP_PASSWORD` | that account's 16-letter app password (you can reuse the one from your sign-in email setup) |
| `WEBHOOK_SECRET` | the random string from step 1 |
| `APP_URL` | the app's web address, for example `https://mysmalltown.pdurairaj.workers.dev` |

### 4. Trigger it when profiles change

1. Open **Database → Webhooks** (in newer dashboards, **Integrations → Database Webhooks**). If asked, click **Enable webhooks**.
2. Click **Create a new hook** and fill in:
   - **Name:** `notify-admin-new-signup`
   - **Table:** `profiles`
   - **Events:** **Insert** and **Update**
   - **Type:** **Supabase Edge Functions**, choosing `notify-admin`, method **POST**
   - **HTTP Headers:** add `x-webhook-secret` with the random string from step 1
3. Click **Create webhook**.

### 5. Test it

Sign up in the app with an email that's never been used, then pick a name and avatar. Within a minute, an alert should arrive at `ADMIN_EMAIL`. Then approve that account, and a "You're approved" email should arrive at the address you signed up with. Check spam the first time.

If nothing arrives, open **Edge Functions → notify-admin → Logs**:

- "Missing secret": one of the secrets in step 3 is misspelled.
- "Forbidden": the webhook's header doesn't match `WEBHOOK_SECRET`.
- An authentication error from Gmail: the app password is wrong.

## Deleting a town

The grown-up who owns a group can delete its town: open **Groups**, make sure that group is selected and you're using the app as yourself, tap **Delete this town**, and type the town's name to confirm. The owner is whoever started the group, or the person it passed to if they left.

This permanently deletes the town, its invite code, and all its notes and visits for everyone in the group. People keep their accounts and any other towns. It can't be undone, and the free Supabase plan has no automatic backups.

As administrator, you can delete any town in the SQL Editor, using its invite code:

```sql
delete from public.groups where invite_code = 'REYES-7KQ3-XM9P';
```

## Deleting accounts

People can delete their own account in the app: **Groups → Delete my account**, then type DELETE to confirm.

To delete someone yourself, run this in the SQL Editor instead of using the dashboard's **Delete user** button:

```sql
select public.delete_account_by_email('their.email@example.com');
```

Either way, the same thing happens, all in one step:

- Their sign-in, email, name and avatar are deleted, and the words of every note they wrote are erased.
- Their past notes and visits stay as anonymous tallies, so every town stays exactly as built: same buildings, same surprises.
- Notes written *to* them show "A former member".
- A group they started passes to its longest-standing remaining member, or is deleted if they were the only one in it.

The dashboard's **Delete user** button skips these steps: it fails for anyone who started a group, and otherwise leaves a nameless member behind.

Only approve emails you recognize. Anyone can request an account, but no one sees anything until you say yes.

## Privacy notes

- **Search engines:** every page tells search engines not to list, follow or archive it. Anyone with the link can still open the sign-in page, but they can't get further without your approval.
- **Invite codes** look like `REYES-7KQ3-XM9P`: 8 random characters, about 850 billion possibilities, so they can't be guessed. Dashes and capital letters don't matter when typing one in.
- **Never** put the `service_role` or secret key in the app, and turn on two-factor sign-in for your Supabase and GitHub accounts.

## How the town grows

This section is for you as the administrator. The app itself keeps what's coming next a surprise.

- Weeks run Monday to Sunday. When at least two-thirds of the group shares a note of appreciation in a week, the next piece of the current building goes up on Sunday night (52 pieces in all, from first homes through a schoolhouse, hospital, main street, park, library and town square).
- A quiet week still adds a tree or flowers. The town never goes backward.
- Visiting on 3 or more days in a week brings one surprise, picked at random but the same on everyone's phone: a streetlight (about 35%), a pet such as a puppy, cat, ducks, bunny or chickens (27%), a pop-up grocery stand, ice cream cart, bakery, lemonade stand or flower stall (18%), a trash clean-up Sunday that leaves the town sparkling all next week (15%), or, rarely, a friendly dinosaur or a superhero (5%).
- Notes of appreciation for people outside the group bring visitors that week.
- Each person can share up to 3 notes of appreciation per day in each group. Growth doesn't speed up with extra notes: the weekly goal counts how many different people shared, and visitors and who's busy in town count each person once a day.
