# My Small Town

A phone-first web app where a group (a family, roommates, a book club) shares notes of appreciation, and every week of appreciation grows the group's shared town.

Plain HTML, CSS and JavaScript with no build step. Data and email sign-in come from [Supabase](https://supabase.com); see **[SETUP.md](SETUP.md)** to connect it. Without it, the app runs in demo mode with data kept on the device.

## Run it

Serve the folder (the app uses JavaScript modules, which don't load from a double-clicked file):

```bash
python -m http.server 5173
```

then visit http://localhost:5173.

## Screens

| File | Screen |
| --- | --- |
| `signin.html` | Email sign-in, your name and your avatar |
| `who.html` | Who's using the app? Switch person, add and manage kids |
| `settings.html` | Email choices for new notes, and your notes (to delete) |
| `index.html` | Group home (or a welcome when you have no group yet) |
| `share.html` | Share a note of appreciation |
| `town.html` | Your town |
| `recap.html` | Sunday recap |
| `stats.html` | Stats |
| `groups.html` | Your groups |
| `new-group.html` | Start a new group |

## Code layout

- `css/styles.css` — design tokens (colors, fonts) and shared components. `--accent` is set from each group's chosen color.
- `js/config.js` — your Supabase project URL and public key.
- `js/api.js` — all data access, with a Supabase backend and a demo backend that share one interface.
- `js/town.js` — the town's growth rules and the drawing of the town scene.
- `js/avatars.js` — the 40 avatars (10 per age group), drawn as round portraits and as figures in town.
- `js/surprises.js` — the surprise a 3-day visit streak brings, how each one is drawn, and pet names.
- `js/townview.js` — the full-screen town view with drag and zoom.
- `js/ui.js` — what every screen does on load: sign-in check, who's using the app, current group, today's visit.
- `js/app.js` — the bottom tab bar and offline support; `sw.js` is the service worker.
- `supabase/schema.sql` — tables and privacy rules.
- `supabase/migrations/` — one-time updates for a database set up from an earlier schema.
- `supabase/functions/notify-admin/` — emails the administrator when someone signs up, and the person when they're approved.
- `supabase/functions/notify-notes/` — emails people about new notes, instantly or as daily or weekly summaries.
