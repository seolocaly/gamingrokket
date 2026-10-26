# Deploy Rokket to Vercel

Static app in `public/`, two serverless functions in `api/`. `vercel.json` sets everything, so leave the dashboard build settings on their defaults.

**The repository root must contain `vercel.json`, `api/` and `public/` directly.** If they sit inside another folder, set that folder as Root Directory in Project Settings → Build and Deployment.

Functions:

- `api/feed.js` → real fixtures, scores and Rokket odds from The Odds API, cached at Vercel's edge for `FEED_TTL` seconds
- `api/tron.js` → latest TRON blocks and TRX Hash draws from TronGrid

The app polls these (sports every 30 s, TRON every 3 s). Vercel functions can't hold open streams or run background loops, so this build polls instead of streaming.

## Option A — Vercel dashboard (no terminal)

1. Push this folder to a new GitHub repository.
2. vercel.com → Add New → Project → import the repo. Framework preset: **Other**. Don't override the build settings.
3. Settings → Environment Variables: add `ODDS_API_KEY` and `TRONGRID_API_KEY` (and any optional values from `.env.example`).
4. Deploy. Then Settings → Domains to add your own domain.

## Option B — Vercel CLI

```bash
npm i -g vercel
cd rokket-vercel
vercel                                   # first deploy, answers: link new project, root = ./
vercel env add ODDS_API_KEY production
vercel env add TRONGRID_API_KEY production
vercel --prod
```

Test without keys: set `MOCK=1` as an environment variable (fake matches and simulated TRON blocks), then remove it before going live.

## Check it works

- `https://your-app.vercel.app/api/tron` → JSON with `blocks` and `draws`
- `https://your-app.vercel.app/api/feed` → JSON with `events`
- In the app, Sportsbook shows **Live feed** and TRX Hash shows **TRON mainnet**.

## Costs and limits

- The Odds API: each feed refresh costs about 3 credits per sport (1 region × 3 markets), plus 2 per sport with live games. With `FEED_TTL=90` and visitors all day, expect roughly 10,000–20,000 credits a day. Raise `FEED_TTL` or trim `SPORTS` to spend less.
- TronGrid free plan: 100,000 requests a day. Vercel's edge cache shares one `/api/tron` response across all visitors for 2 seconds, so usage stays near 30,000–45,000 a day regardless of traffic.
- Vercel Hobby (free) is for non-commercial use only. A live, revenue-earning site needs the Pro plan.
