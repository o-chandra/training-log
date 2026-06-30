# Training Log

A lightweight, no-backend training log for climbing and cardio sessions — weekly/monthly calendar views, vibe-based color coding, points tracking, and fuel/gear notes. All data is stored locally in the browser (`localStorage`), with manual export/import for backups.

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
│   └── seed-data.json  # One-time historical data import (your spreadsheet history)
├── assets/
│   └── mountain-bg.jpg # Background photo
└── api/
    └── strava-token.js # Serverless function stub for Strava OAuth (see below)
```

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

All your entries (days, climbs, cardio, fuel notes) are saved in your browser's `localStorage` under the key `training-log-v1`. This means:

- Data is **per-browser, per-device**. It won't sync between your phone and laptop automatically.
- Clearing your browser's site data will erase your log. **Use the Export backup button regularly** to download a JSON snapshot you can keep safe or re-import elsewhere.
- The `data/seed-data.json` file only seeds the app *once*, on first load with empty storage (or merges in anything new without overwriting your existing entries). It's not a live sync — editing that file won't update an already-seeded browser; use Import backup for that instead.

## Strava integration (in progress)

The `api/strava-token.js` file is a stub for the OAuth token exchange step required to connect Strava. GitHub Pages can only serve static files, so this function needs to run somewhere that supports server-side code — a Cloudflare Worker, a Vercel/Netlify serverless function, etc. The stub includes notes on what it needs to do once you're ready to wire it up.

## Customizing

- **Background image:** swap `assets/mountain-bg.jpg` for any photo you like — same filename, or update the path in `css/styles.css` under `.hero-bg`.
- **Points formulas:** edit the `CLIMB_GRADES`, `TERRAIN_MILE_PTS`, and `TERRAIN_VERT_PTS` constants near the top of `js/app.js`.
- **Colors:** the `:root` CSS variables at the top of `css/styles.css` control the vibe colors (good/medium/bad) and overall theme, including a dark mode variant.
