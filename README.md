# TradingLab AI — Landing Page

Marketing landing page for the AI trading companion. **Isolated from the trading
app** — this repo only contains the public website, so it can be deployed and
iterated on without touching the bot.

- **Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Framer Motion · lucide-react
- **Design:** dark trading-workstation aesthetic, glassmorphism, purposeful motion,
  fully responsive, reduced-motion aware.
- **Content:** built to the `TradingLab AI` three-page content map (homepage first).

## Local development

```bash
npm install
npm run dev        # http://localhost:3000
```

Build check (what Vercel runs):

```bash
npm run build
npm start
```

## Configure in one place

Edit `lib/site.ts`:

- `brand` / `brandShort` — the product name shown everywhere.
- `appUrl` / `signInUrl` — where every CTA ("Build Your Strategy", "Get Started",
  "Sign In") sends visitors. Point these at your live app.
- `plans` / `planFeatures` — the pricing tiers (1 / 3 / 6 / 12 months).

## Deploy to Vercel

1. Push this folder to the GitHub repo (see below).
2. On [vercel.com](https://vercel.com) → **Add New → Project** → import the repo.
3. Framework preset auto-detects **Next.js**. No env vars required. Click **Deploy**.
4. You get a `*.vercel.app` URL immediately.

### First push to the repo

```bash
cd autotrade-home
git init
git add -A
git commit -m "feat: TradingLab AI landing page"
git branch -M main
git remote add origin https://github.com/ankit6868/Autotrade-Home.git
git push -u origin main
```

### Custom domain

Vercel → your project → **Settings → Domains → Add** → enter your domain and
follow the DNS instructions (A record `76.76.21.21` or a `CNAME` to
`cname.vercel-dns.com`). SSL is issued automatically.

## Editing content

Every section is its own component in `components/`, composed in `app/page.tsx`
in scroll order. Swap copy, reorder sections, or drop the `Intelligence` teaser
without affecting the rest.

## Honesty guardrails (kept from the content map)

- No fabricated user counts, win rates or "guaranteed" language.
- Charts/tables carry an **"Illustrative sample"** label.
- A visible **risk disclosure** lives in the footer.

Replace illustrative mockups with real product screenshots before a public launch.
