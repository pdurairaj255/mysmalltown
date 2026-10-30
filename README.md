# My Small Town

A phone-first web app where a group (a family, roommates, a book club) shares one thank-you a day, and every week of thank-yous grows the group's shared town.

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
| `index.html` | Group home (or a welcome when you have no group yet) |
| `share.html` | Share a thank-you |
| `town.html` | Your town |
| `year.html` | The year ahead |
| `recap.html` | Sunday recap |
| `stats.html` | Stats |
| `groups.html` | Your groups |
| `new-group.html` | Start a new group |

## Code layout

- `css/styles.css` — design tokens (colors, fonts) and shared components. `--accent` is set from each group's chosen color.
- `js/config.js` — your Supabase project URL and public key.
- `js/api.js` — all data access, with a Supabase backend and a demo backend that share one interface.
- `js/town.js` — the town's growth rules and the drawing of the town scene.
- `js/avatars.js` — the 20 avatars, drawn as round portraits and as figures in town.
- `js/ui.js` — what every screen does on load: sign-in check, current group, today's visit.
- `js/app.js` — the bottom tab bar and offline support; `sw.js` is the service worker.
- `supabase/schema.sql` — tables and privacy rules.
