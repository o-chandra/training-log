# Training Log

A lightweight, no-backend training log for climbing and cardio sessions. The app has two modes, switched via the **Log / Plan** toggle at the top:

- **Log mode** — the day-to-day logging you're used to: a weekly/monthly calendar with vibe-based color coding, plus dedicated tabs for Climbs, Cardio, Strength/Stretch, Fuel & gear, and Stats.
- **Plan mode** — everything about what you're aiming for and when: **Big goals** (with sub-milestones), a **Yearly overview** (activity heatmap + month-by-month summary), **Training cycles** (named blocks like "Yosemite prep — Apr 1-May 15"), and **Monthly**/**Weekly** plan views where you can sketch out and check off planned sessions.

All data is stored locally in the browser (`localStorage`), with manual export/import for backups.

## Live site

Once deployed to GitHub Pages, this will be available at:
`https://<your-username>.github.io/<repo-name>/`

## Project structure

```
training-log/
├── index.html          # Page shell, links the CSS/JS below
├── css/
│   └── styles.css      # All styling
├── js/
│   └── app.js          # All app logic (state, rendering, modals)
├── data/
│   └── seed-data.json  # Optional one-time historical data import (git-ignored -- not in the repo, see note below)
├── assets/
│   └── mountain-bg.jpg # Background photo
└── api/
    └── strava-token.js # Serverless function stub for Strava OAuth (see below)
```

## App structure: Log mode vs. Plan mode

The top of the app has a **Log / Plan** switch. Each mode has its own row of tabs underneath:

**Log mode**
- *Weekly log* — the actual calendar (week or month view) of what you did, with vibe coloring.
- *Climbs*, *Cardio*, *Strength/Stretch*, *Fuel & gear* — detailed session logs.
- *Stats* — lifetime totals and a pitch/grade breakdown.

**Plan mode**
- *Big goals* — structured goals (title, category, target date, status) each with their own checklist of milestones.
- *Yearly overview* — a GitHub-style activity heatmap for the selected year, plus month-by-month summary cards showing sessions/pitches/miles, any training cycles overlapping that month, and any goal deadlines falling in it.
- *Training cycles* — named date-range blocks (e.g. "Winter base building — Jan-Mar") with a free-text focus, useful for periodization.
- *Monthly* — a plan-only calendar grid where you jot a short plan per day (trips, planned sessions, rest days) and mark days done.
- *Weekly* — a checklist view of the current week's plan with more room for detail per day, and a checkbox per day.

Plan data (goals, cycles, and the day-by-day plan notes) is stored completely separately from your actual logged sessions — checking something off in Plan mode never touches your real Climbs/Cardio/etc. entries, and vice versa.

## Running locally

This is a static site with no build step. Two options:

**Option A — just open it.** Double-click `index.html`. Note: the seed-data fetch may be blocked by some browsers' file:// security restrictions, so historical data might not auto-load this way. Everything else works fine.

**Option B — local server (recommended).** From the project root:
```bash
python3 -m http.server 8000
```
Then visit `http://localhost:8000`.

## Deploying to GitHub Pages

1. Create a new repo on GitHub (e.g. `training-log`).
2. Push this folder's contents to the repo's default branch:
   ```bash
   cd training-log
   git init
   git add .
   git commit -m "Initial training log"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
3. In the repo on GitHub: **Settings → Pages → Source → Deploy from a branch → main → / (root)**.
4. Wait a minute or two, then visit the URL GitHub gives you.

That's it — no build process, no dependencies to install.

## How data persistence works

All your entries (days, climbs, cardio, strength/stretch, fuel notes, plan items, goals, training cycles) are saved in your browser's `localStorage` under the key `training-log-v1`, and also mirrored to a private GitHub Gist if you've connected Cloud backup (see the "Cloud backup" button in the app). This means:

- Data is **per-browser, per-device** unless Cloud backup is connected, in which case you can pull it into a new browser/device via "Restore latest from cloud."
- Clearing your browser's site data will erase your log if Cloud backup isn't connected. **Use the Export backup button regularly** as an additional safety net regardless.
- `data/seed-data.json` is **git-ignored, not committed to this repo** — it exists only as an optional local file for seeding a brand-new browser with historical data (e.g. from an old spreadsheet). If the file isn't present, the app just starts empty and that's fine. This was changed so a public/shared repo doesn't expose your actual training history in git; your real data lives in `localStorage` and your private Gist backup instead.

## Strava integration (in progress)

The `api/strava-token.js` file is a stub for the OAuth token exchange step required to connect Strava. GitHub Pages can only serve static files, so this function needs to run somewhere that supports server-side code — a Cloudflare Worker, a Vercel/Netlify serverless function, etc. The stub includes notes on what it needs to do once you're ready to wire it up.

## Customizing

- **Background image:** click the "Background" button (top of the app) to pick from a few built-in photos, or swap in your own by adding a file to `assets/` and a matching thumbnail to `assets/thumbs/`, then adding an entry to the `BG_OPTIONS` array near the top of `js/app.js`. Your choice is remembered per-browser (`localStorage`), not synced via Cloud backup.
- **Light/dark mode:** the ☀️/🌙 button next to Cloud backup lets you force light or dark mode regardless of your OS setting; that choice is remembered per-browser. Leave it untouched and the app follows your system's light/dark preference automatically, same as before.
- **Climb grade catalog:** edit the `CLIMB_GRADES` constant near the top of `js/app.js` to add, remove, or rename gradeable categories. The app tracks pitch/problem *counts* per grade rather than a points system — the Stats tab's pitch breakdown is filterable by date range, venue, and climb type.
- **Colors:** the `:root` CSS variables at the top of `css/styles.css` control the vibe colors (great/good/medium/bad) and overall theme, including light and dark variants.
