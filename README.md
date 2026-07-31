# craft

A multi-page portfolio site powered by the [content.jovylle.com](https://content.jovylle.com) data vault.
Hono + TypeScript on Cloudflare Workers. Live at **https://craft.uft1.com**.

## Stack

- [Hono](https://hono.dev) (server-rendered JSX) — no client framework
- TypeScript (strict) · Zod (vault payload validation) · marked (markdown)
- Vitest + `app.request()` — every route tested with mock data
- Handcrafted CSS: layered dot-grid + noise + aurora backdrop, Space Grotesk / Inter / JetBrains Mono

## Local development

```bash
nvm use 20
npm install
npm run dev        # wrangler dev → http://localhost:8787
```

## Tests

```bash
npm test           # vitest — route handlers, schemas, cache, sanitizer, markdown
npm run typecheck  # tsc --noEmit
```

## Deploy

```bash
npm run deploy     # wrangler deploy → craft.uft1.com
```

Push to `main` also deploys via GitHub Actions (requires `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` secrets).

## Routes

| Route | Source |
|---|---|
| `/` | homepage + profile + projects + blogs + social |
| `/projects` | personal-projects.json |
| `/projects/:slug` | personal-projects.json |
| `/blog` | blogs/index.json |
| `/blog/:slug` | blogs/{slug}.json |

Content updates are picked up automatically (cached ~5 min per isolate).
