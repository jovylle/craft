## [2026-07-31] Session 1 — planning complete, awaiting execution approval

**State:** Design approved by user (with changes). Implementation plan written, self-reviewed, NOT yet executed. No application code exists yet.

**Project facts:**
- Folder: /Volumes/DevSSD/fore/lab/craft (sibling of waaheheho — user rejected that name)
- Live URL: craft.uft1.com (custom domain on uft1.com zone) · Repo: github.com/jovylle/craft (public)
- Stack: Hono 4 + hono/jsx (SSR), TypeScript strict, Zod, marked, Vitest + app.request(), Wrangler, custom CSS (no Tailwind), vanilla JS filter
- Content source: content.jovylle.com (homepage/profile/personal-projects/blogs index+post/social endpoints)
- Design: dark ink #070b12, dot-grid + SVG noise + aurora blobs backdrop, Space Grotesk/Inter/JetBrains Mono, outlined alternating hero headline, tech marquee, section indices, hover-glow cards, prefers-reduced-motion
- User brief: multi-page (home /projects /projects/:slug /blog /blog/:slug + 404), "modern but not usual design with pattern/background", easily testable → Hono

**Docs:**
- Design: docs/superpowers/specs/2026-07-31-craft-site-design.md
- Plan: docs/superpowers/plans/2026-07-31-craft-site.md (13 TDD tasks, checkbox steps)

**Decisions made (see decisions.md):** B multi-page scope; dark-modern + pattern direction; repo/folder name craft; hero CTAs curated (data routes don't exist here); scaffold posts filtered from blog; home route degrades gracefully, /projects surfaces 500.

**Next step (blocked on user):** user must approve execution + choose mode. Default = subagent-driven (option 1): task() per plan task, verify with npm test + typecheck after each, commit between tasks, then deploy (Task 12) + push (Task 13).

## [2026-07-31] Task 1 — scaffold + smoke test done
- Scaffolded Hono + TS + Vitest worker exactly per plan brief; `npm test` 1/1 green, `tsc --noEmit` exit 0.
- Surprise: vitest 4 uses oxc by default and warns "oxc options will be used and esbuild options will be ignored" — the brief's `vitest.config.ts` esbuild/jsx block is inert. If hono/jsx tests misbehave later, move config to `oxc` key or pin vitest 3.
- `npm ls hono marked zod`: hono@4.12.33, marked@18.0.7, zod@4.4.3.

## [2026-07-31] Task 2 — zod schemas for vault endpoints done
- Wrote `test/schemas.test.ts` first (brief step 1), confirmed FAIL `Cannot find module '../src/data/schemas'`, then `src/data/schemas.ts` (9 tests green, `tsc --noEmit` exit 0). Committed `0165ee6`.
- Observed under zod 4.4.3: `.optional().default(x)` (e.g. `z.boolean().optional().default(false)`, `z.string().optional().default('')`) still typechecks and behaves as in zod 3 — default fills `undefined`, output type has `undefined` stripped, so optional-default fields are effectively required-after-parse. `z.infer` unchanged. (Zod 4's preferred idiom is bare `.default()` which already implies optional input; the brief's chained form is fine too.)
- Same vitest 4 oxc warning as Task 1 ("esbuild options will be ignored") — harmless for schema tests since no jsx involved.

## [2026-07-31] Task 3 — data client + TTL cache done
- Wrote tests first (brief step 1) → FAIL `Cannot find module '../src/lib/ttl-cache'` / `'../src/data/client'` → implemented → 16/16 targeted green, `tsc --noEmit` exit 0, full suite 26/26. Committed `3cf8995`.
- Two brief-spec bugs surfaced; fixed both (deviations from verbatim brief code, documented in report):
  1. Brief's `TtlCache.get` deleted expired entries — that destroyed the stale data `peek()` needs for the fallback path (`getHomepage` after expiry + 503 failed the brief's own test). Fix: `get` leaves expired entries in place (returns `undefined`, no delete), so `peek` can still serve them. The unit test "clears it after" only asserts the return value, not store size, so this stays green.
  2. Task 2's `ProjectsSchema`/`BlogIndexSchema` wrap arrays with `.default([])` — a missing wrapper key (e.g. `{wrong:true}`) parses as valid and `getProjects()` resolved `[]` instead of throwing. Fix: client defines `ProjectsResponseSchema`/`BlogIndexResponseSchema` (wrapper key required, no default) reusing Task 2's element schemas. Verified against live vault payloads (`personal-projects.json`/`blogs/index.json`) — wrapper key is the only top-level key, so this matches real data.
- z.ZodType<T> accepts a `z.object({...})` in client.ts with a value import of `z` (brief used `import type { z }`; the wrapper schemas need the runtime value).

## [2026-07-31] Task 4 — markdown renderer + sanitizer done
- marked@18 `parse()` returns a string synchronously (await is harmless, kept for API robustness); gfm+breaks verified — single newline renders `<br>`. Full suite 38/38, committed `2861c27`.
- Two deviations from brief sanitizer code (its own tests failed otherwise): (1) `<a>` with dangerous href keeps the element and drops only the href (brief dropped the whole element → `bad` instead of `<a>bad</a>`); `<img>` with bad src still drops the element. (2) `escapeAttr` is entity-aware — raw `&` is escaped but already-encoded entities like `&amp;` pass through (brief double-escaped to `&amp;amp;`, failing its own test 7).

## [2026-07-31] Task 5 — layout shell + full stylesheet done (JSX-in-Vitest4 resolved)
- Wrote `test/dates.test.ts` + `test/layout.test.ts` first → FAIL as expected, but layout.test.ts failed with oxc `[PARSE_ERROR] Expected '>' but found Identifier`: Vitest 4's oxc transformer derives `lang` from the file extension, so JSX inside a `.ts` file never parses — the esbuild jsx block is inert (auto-converted to oxc, but only fixes importSource, not parsing). Root cause verified by driving `rolldown/utils` `transformSync` directly: `lang:'ts'` = parse error, `lang:'tsx'` = emits `hono/jsx/jsx-runtime`.
- **Fix (documented, config-driven):** the test file had to become `test/layout.test.tsx` because tsc ALSO rejects JSX in a `.ts` extension (TS1005) — no compiler option enables JSX in `.ts`; `jsx` only applies to `.tsx`. Renamed the file, widened vitest include to `test/**/*.test.{ts,tsx}`, and replaced the inert esbuild block with `oxc: { jsx: { runtime: 'automatic', importSource: 'hono/jsx' } }`. Tried the `oxc.lang: 'tsx'` hack first (works at runtime but is not in OxcOptions type and forces tsx parsing project-wide) — dropped it once the rename made extension detection sufficient.
- **Second brief bug:** Step 4's `render()` helper (`jsx('div', { children: node })`) rendered `<div></div>` — hono's `jsx(tag, props, ...children)` only threads children through the rest args for intrinsic elements; `props.children` is skipped in the attribute loop. Fix: `jsx('div', null, node as Child)`. Kept the same hono/jsx `jsx` import as the brief.
- `SocialLink` type is NOT exported from `src/data/schemas.ts` (only `SocialLinkSchema`/`Social`). Defined `export interface SocialLink { label; url; icon? }` in `layout.tsx` (structurally identical to `z.infer`). schemas.ts is Task 2's file — not modified.
- Layout fragment + `html` from 'hono/html' renders `<!doctype html>` correctly. Targeted 6/6 (4 dates + 2 layout), `tsc --noEmit` exit 0, full suite 44/44.

## [2026-07-31] Task 6 — homepage route + view done
- Homepage live: `HomeView` (hero with alternating outline/accent words, curated CTAs, tech marquee, Featured work + Latest writing grids), `ProjectCard`/`PostCard`, `homeRoutes` with `.catch(() => [])` graceful projects degradation. Targeted 5/5, `tsc --noEmit` exit 0, full suite 49/49.
- **Route files with JSX must be `.tsx`** — same Task 5 root cause: tsc (TS1005) and vitest 4 oxc both reject JSX in `.ts`. Brief's `src/routes/home.ts` → `home.tsx`; `'../src/routes/home'` import still resolves. Applies to every future route that renders JSX.
- zod optional-default fields are required in inferred output types (Task 2 note bites fixtures): fixture projects needed `private: false` + `language: ''` or `Project[]` typecheck failed.
- hono/jsx escapes `'` → `&#39;` in text nodes, and the hero title splits words into `<span>`s — a contiguous "It's me, Jovylle" never exists in output. Assert `<h1 class="hero-title">` + escaped first word instead.
- `DataClient.getBlogIndex()` returns `BlogPostSummary[]` directly (not `{posts}`) — fixtures return `posts`, route sorts `[...blogIndex]`.

## [2026-07-31] Task 7 — projects list + client-side filter done
- `project-filter.ts` (applyFilter/collectTags), `ProjectsView`, `projectsRoutes` (as `.tsx` — JSX route convention), `public/app.js` filter glue. Targeted 9/9, `tsc --noEmit` exit 0, full suite 58/58.
- Brief bug: `test/projects.test.ts` requested `app.request('/')` while the route registers `GET /projects` (the brief's own stated interface + test descriptions) → 404. Fixed the test to request `/projects` (matches `home.test.ts` pattern of requesting the registered path). Route itself unchanged.
- `SocialLink` comes from `'../views/layout'` (Task 5 convention; schemas.ts does not export it).
- `wrangler dev` cannot boot locally: Worker compat date `2026-07-31` exceeds wrangler 4.86.0's newest supported (`2026-05-03`). Task 8+ manual dev checks will hit the same wall — wrangler upgrade required for dev-server verification.

## [2026-07-31] Task 8 — project detail page + 404 done
- `projectDetailRoutes` (as `.tsx` — JSX route convention), `ProjectDetailView`, shared `NotFoundView` (Layout with `socialLinks={[]}` for Tasks 10/11). Targeted 2/2, `tsc --noEmit` exit 0, full suite 60/60. Committed `1420e0e`.
- Brief's route file `project-detail.ts` → `.tsx` per Task 5/6 convention (JSX). Extensionless test import `'../src/routes/project-detail'` resolves either way.
- Brief's `getProject` used `this.getProjects()` inside the returned object literal — a strict-mode typing hazard in TS. Implemented by closing over a local `fetchProjectsNormalized()` (also now backs `getProjects: fetchProjectsNormalized`); `getProject` = `find` over that. No `this.` in the object literal.
- `SocialLink` imported from `'../views/layout'` (Task 5 convention), not `'../data/schemas'` as the brief wrote.
- Fixtures `createMockClient` got `getProject: async (slug) => projects.find((p) => p.slug === slug)`; existing fixture projects already carry `private`/`language` so `Project[]` typechecks.
- Also fixed `wrangler.toml` compat date `2026-07-31` → `2026-05-03` (unblocks `wrangler dev` for Task 11 manual QA; issues.md item resolved).

## [2026-07-31] Task 9 — blog list page done
- `BlogView` + `blogRoutes` (`.tsx` — JSX route convention), shared `src/data/sort.ts` (`isRealPost` filters scaffold posts like `blog-post`; `sortPosts` returns a new array). Home `recent` now `sortPosts(blogIndex).slice(0, 3)`. Targeted 7/7 (2 blog + 5 home), `tsc --noEmit` exit 0, full suite 62/62. Committed `1f86e03`.
- `baseUrl` param of `blogRoutes` is unused (PostCard links are relative) — kept for signature parity with other route factories; tsc has no `noUnusedParameters`, so no error.

## [2026-07-31] Task 10 — blog post detail page done
- `PostView` + `postRoutes` (`.tsx` — JSX route convention), `dangerouslySetInnerHTML` renders markdown body pre-sanitized by `renderMarkdown` (sanitizer is the boundary — no double-sanitize). Targeted 2/2, `tsc --noEmit` exit 0, full suite 64/64. Committed after report.
- `SocialLink` from `'../views/layout'` (Task 5/7/8 convention), not `'../data/schemas'` as brief wrote; route file `.ts` → `.tsx` per Task 5/6/8.

## [2026-07-31] Task 11 — app composition + route suite done
- `src/app.tsx` (`.tsx` REQUIRED — notFound/onError render JSX; tsc rejects JSX in `.ts`), `createApp({ data, baseUrl = DEFAULT_BASE_URL })` composes all five route factories at `/`, notFound → NotFoundView 404, onError → console.error + NotFoundView("Something went wrong — try again shortly.") 500. `src/index.ts` = module-scope singleton. Full suite 72/72 (8 new routes tests), `tsc --noEmit` exit 0. Committed `6220f2a`.
- **Brief smoke-test bug:** brief's `test/smoke.test.ts` imports `../src/index` (real `createDataClient()` — live vault) yet its own note claims "mock data layer never hits the network (injected client)". The real-client version hits content.jovylle.com and timed out (>5s under parallel test load; single homepage.json fetch alone ~2.5s). Fix per prompt correction: smoke test injects `createMockClient()` into `createApp` — hermetic, full URL `https://example.com/`, asserts `<!doctype html>`.
- **Hero-escape correction (prompt):** routes test asserts `It&#39;s` + `Open to opportunities` (hono escapes `'` → `&#39;`; hero title renders per-word spans) — never assert contiguous "It's me, Jovylle".
- **Post h1 note:** test asserts `<h1>Project Factory</h1>` which matches the FIXTURE's markdown body (`# Project Factory` → `<h1>`). Live vault post renders `<h1 class="article-title">Project Factory: 500 Apps Built by Underpaid AI</h1>` — assertion is fixture-specific, passes in suite.
- **`wrangler dev` boots now** (compat date 2026-05-03 fix from Task 8): Ready on http://localhost:8787. Curled all routes — `/` 200 (hero + "Open to opportunities"), `/projects` 200 (SFL Digging Assistant + filter markup), `/projects/sfl-crab` 200 (d1g.uk), `/blog` 200 (Project Factory), `/blog/project-factory-500-autonomous-ai-apps` 200 (article h1), `/projects/nope` + `/blog/nope` + bogus path 404 (404 page + Back to home). Real vault content renders.

## [2026-07-31] Task 12 — deployed + custom domain done
- Deploy gate: `npm run typecheck && npm test` 72/72. Live: https://craft.jovyllebermudez.workers.dev + custom domain craft.uft1.com (attached via CLI, committed `35378a6`).
- **Quirk 1 — auth:** deploy fails with `Authentication error [code: 10000]` on `/memberships` unless `CLOUDFLARE_ACCOUNT_ID=7f0e409fd621476eb621ef4c9a436374` is set (env-var API token lacks membership read; whoami still works without it).
- **Quirk 2 — workers.dev:** adding a `routes` block WITHOUT `workers_dev = true` DISABLES workers.dev (wrangler default) → workers.dev URL 404s. Keep `workers_dev = true` alongside custom-domain routes.
- **Quirk 3 — upstream flakiness:** content.jovylle.com/data/*.json intermittently 503s (esp. blogs/index.json, social.json, homepage.json) → `/` and `/projects` intermittently 500 via the app's onError. Only getProjects() is caught graceful; a 503 on blogIndex/social throws. Not a deploy defect — vault health issue, observed in `wrangler tail craft` logs.
- **Task 12 FIX (commit `2660d30`):** `getJson` now retries ONCE on `status >= 500` (4xx never retried — getPost 404→undefined depends on it). Single-blip 503s are gone; sustained double-503s still 500 by design. Suite 73/73. Redeployed as version `37efcd0d`.


## [2026-07-31] Task 13 — repo push + CI + README done
- Pushed all 15 local commits (c0fdd39..2660d30) + 3 new (README, workflows, notepads) to origin/main (jovylle/craft, public, ssh). origin/main == HEAD after push.
- Added .github/workflows/ci.yml (typecheck+test gate on push/PR) and deploy.yml (npm ci → npm test → cloudflare/wrangler-action@v3 with apiToken+accountId secrets). README.md per brief.
- Secrets: repo has NO CLOUDFLARE_* secrets set; `gh secret list` 403s on the active fine-grained PAT (no Actions-secrets permission) → a human must add CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID via repo settings. Deploy workflow will fail on first run without them.
