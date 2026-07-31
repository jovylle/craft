## [2026-07-31] Resolved: Vitest 4 JSX config
Vitest 4 (oxc transforms) derives parse `lang` from the file extension — JSX in a `.ts` file never parses (esbuild jsx block inert), and tsc also rejects JSX in `.ts` (TS1005). Fixed in Task 5: JSX tests live in `.test.tsx` files, vitest include widened to `test/**/*.test.{ts,tsx}`, oxc `jsx: { runtime: 'automatic', importSource: 'hono/jsx' }` block added in vitest.config.ts.
## [2026-07-31] Resolved: brief Task 3 code had 2 self-failing tests
1. TtlCache.get deleted expired entries -> stale fallback via peek() found nothing. Fix: get() leaves expired entries (returns undefined without delete).
2. Zod .default([]) masked missing wrapper key ({wrong:true} parsed as []). Fix: client.ts defines ProjectsResponseSchema/BlogIndexResponseSchema requiring the wrapper key. Verified against live vault (wrapper keys always present).
Recorded so a resumed session does not re-apply the brief's original Task 3 code verbatim.
## [2026-07-31] Resolved: brief Task 4 sanitizer contradicted 2 of its tests
1. <a> with javascript: href — brief dropped whole element, test expected <a>bad</a> (element kept, href dropped). img still dropped whole.
2. escapeAttr double-escaped &amp; -> made entity-aware (only bare & escaped).
## [2026-07-31] Resolved: Task 5 brief bugs (3)
1. JSX test file must be .tsx (oxc + tsc reject JSX in .ts) -> layout.test.tsx; vitest include widened to {ts,tsx}; oxc jsx config replaces inert esbuild block. ROOT CAUSE FOUND + fixed for all future TSX tests.
2. hono/jsx jsx() threads children via rest args -> test-render.tsx uses jsx('div', null, node).
3. schemas.ts lacks `export type SocialLink` -> layout.tsx defines+exports its own. Convention for later views: import type { SocialLink } from '../views/layout'.
## [2026-07-31] Resolved: Task 6 brief bugs (4) — carries forward to Tasks 7-10
1. Route files rendering JSX MUST be .tsx (tsc TS1005 + vitest/oxc reject JSX in .ts). Convention: src/routes/*.tsx for JSX routes. home.ts -> home.tsx.
2. DataClient.getBlogIndex returns BlogPostSummary[] (not {posts}); fixtures + routes use array.
3. zod-defaulted fields (private, language, etc.) are REQUIRED in inferred types -> fixtures must include them.
4. hono escapes ' -> &#39; and splits hero title into spans -> hero-title assertions use 'It&#39;s'.
## [2026-07-31] Open (fix folded into Task 8): wrangler compat date
wrangler 4.86.0 rejects compatibility_date 2026-07-31 in `wrangler dev` (binary max 2026-05-03). deploy --dry-run passes. Fix: set compatibility_date = "2026-05-03" in wrangler.toml.
## [2026-07-31] Resolved: Task 7 brief test path bug
test/projects.test.ts used app.request('/') but route is /projects -> fixed to /projects (implementer).
