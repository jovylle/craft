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
