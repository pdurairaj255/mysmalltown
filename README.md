# My Small Town

A phone-first web app where a group (a family, roommates, a book club) shares one thank-you a day, and every week of thank-yous grows the group's shared town.

Plain HTML, CSS and JavaScript — no build step or installs.

## Run it

Open `index.html` in a browser, or serve the folder:

```bash
python -m http.server 5173
```

then visit http://localhost:5173.

## Screens

| File | Screen |
| --- | --- |
| `index.html` | Group home |
| `share.html` | Share a thank-you |
| `town.html` | Your town |
| `year.html` | The year ahead |
| `recap.html` | Sunday recap |
| `stats.html` | Stats |
| `groups.html` | Your groups |
| `new-group.html` | Start a new group |

## Code layout

- `css/styles.css` — design tokens (colors, fonts) and shared components. The group's accent color is `--accent` at the top.
- `js/app.js` — the bottom tab bar, shared by every screen.
- Each page keeps its own small script for its interactions.

All names, thank-yous and numbers are sample content; nothing is saved yet.
