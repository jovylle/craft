# Craft — Multi-Page Portfolio Site (Hono + Cloudflare Workers)

**Date:** 2026-07-31
**Status:** Approved design (user: "yes do name other than waaheheho bro... use subdomain of uft1.com")

## Goal

A beautiful, distinctive multi-page website for Jovylle, powered entirely by the public
content vault at `content.jovylle.com`. Built with **Hono** (chosen by the user for its
testability), deployed to **Cloudflare Workers**, served at **craft.uft1.com**, and pushed
to **github.com/jovylle/craft**.

## Naming (user-approved changes)

- Folder: `/Volumes/DevSSD/fore/lab/craft` (sibling of `waaheheho`, not inside it)
- Repo: `github.com/jovylle/craft`
- Live URL: `craft.uft1.com` (custom domain on the uft1.com zone, Worker route)
- Name rationale: free on DNS wildcard, free in tunnel config, free in PROJECTS.md, no
  existing lab folder conflict. "Craft" = things built + things written.

## Stack

| Concern | Choice | Why |
|---|---|---|
| Language | TypeScript | Types across data + handlers |
| Server | Hono 4 + `hono/jsx` (TSX) | Tiny, Workers-native, `app.request()` testing |
| Markdown | `marked` | Server-side render of post `content` |
| Validation | Zod | Data vault payloads validated at the boundary |
| Tests | Vitest + `hono/testing` | Route handlers tested without a server |
| Dev/deploy | Wrangler | Native Workers workflow |
| Styling | Handcrafted CSS + design tokens | Distinctive; no template Tailwind look |
| Interactivity | Vanilla TS (tiny) | Search/filter on /projects only |

No client framework. No database. No auth.

## Routes

| Route | Source data | Renders |
|---|---|---|
| `/` | homepage, profile, personal-projects, blogs, social | Hero (title/tagline/description/gh handle), bio + availability badge, featured projects (fav + top `priority_score`, thumbnails), 3 latest posts, social links, footer |
| `/projects` | personal-projects | Grid sorted by `priority_score` desc, tech tags, live search/filter (vanilla JS) |
| `/projects/:slug` | personal-projects (find by slug) | Description, tech chips, links (repo/live/blog/playstore), thumbnail, created/updated dates, language |
| `/blog` | blogs index | All posts: date, excerpt, tags, featured badge, sorted by date desc |
| `/blog/:slug` | `data/blogs/{slug}.json` | Full markdown post: title, author, date, tags, thumbnail, rendered content |
| `*` | — | Styled 404 with link home |

Project thumbnails are relative (`/images/...`) → resolve to `https://content.jovylle.com/images/...`.

## Data Layer (`src/data/`)

- One typed fetcher module per endpoint (homepage, profile, projects, blogs index,
  blog post, social), each defined by a Zod schema.
- All fetchers accept a `fetchFn` + cache store for dependency injection → testable.
- Caching: Cache API keyed by URL + in-memory TTL fallback (e.g. 300s). On fetch
  failure, serve stale in-memory copy; last resort → graceful empty/reduced render.
- Base URL from env `CONTENT_BASE_URL` (default `https://content.jovylle.com`).
- A route handler never calls `fetch` directly; it calls `data.getProjects(ctx)` etc.

## Visual Direction — "modern, not the usual template"

Layered backdrop (pure CSS, zero image dependencies except vault thumbnails):
1. Deep ink-navy base (`#0b0f17` family).
2. Fixed SVG noise texture (data-URI) + faint dot-grid pattern overlay.
3. Two large blurred aurora gradient blobs, very slow drift animation
   (CSS `@keyframes`, `prefers-reduced-motion` respected).
4. Hero section uses a vault thumbnail (blend-mode, low opacity) behind type.
5. Type: Space Grotesk (display) + Inter (body) + JetBrains Mono (accents) via Google Fonts.
6. Unusual details: oversized outlined hero headline, scrolling tech-stack marquee,
   section index numbers (01 / 02 / 03), card hover glow, chip-style tags.

Accessible: WCAG-AA contrast on text over backdrop, semantic HTML, skip link,
`prefers-reduced-motion` off-switch, alt text from data.

## Testing (the point of Hono)

`npm test` = Vitest run. Suites:
- **routes.test.ts** — every route via `app.request()` with mocked data:
  200 + expected markers; 404 for unknown slug; unknown route → styled 404.
- **data.test.ts** — Zod schemas accept real-shaped payloads, reject malformed;
  cache hit serves cached copy; fetch failure falls back to stale cache.
- **markdown.test.ts** — marked output contains expected HTML, escapes raw HTML input.
- **app.test.ts** — root returns HTML with `<!doctype html>`, correct content-type.

CI (GitHub Actions): `npm ci && npm test && npm run build` on push/PR.
Optional deploy job: `wrangler deploy` on push to `main` (CI token).

## Deploy

1. `npx wrangler deploy` → `craft.<account-subdomain>.workers.dev` (sanity check).
2. Custom domain: add `craft.uft1.com` route to the Worker on the uft1.com zone
   (dashboard or `wrangler.toml` routes + zone binding). If CLI lacks zone access,
   document the 2-click dashboard step.
3. Push: `gh repo create jovylle/craft --public --source . --push`.
4. Update `PROJECTS.md` with the new row (lab convention).

## Non-Goals (v1)

- No client framework, no hydration.
- No auth, forms, D1, KV, or R2.
- No CMS editing UI (content stays in the vault).
- No /resume page (can be added later from resume.json).
