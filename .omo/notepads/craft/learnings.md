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
