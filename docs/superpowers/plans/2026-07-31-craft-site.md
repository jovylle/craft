# Craft Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `craft` — a beautiful multi-page portfolio site for Jovylle, powered by the `content.jovylle.com` data vault, written in Hono + TypeScript, deployed to Cloudflare Workers at `craft.uft1.com`, pushed to `github.com/jovylle/craft`.

**Architecture:** A single Hono Worker serves server-rendered HTML (hono/jsx TSX views) for six routes. A typed, Zod-validated data client (dependency-injected `fetchFn` + TTL cache) is the only gateway to the content vault. Routes are composed into a testable `createApp(data)` factory; every route handler is asserted with `app.request()` in Vitest using mock data. Design is handcrafted CSS (no Tailwind): layered dot-grid + noise + aurora backdrop, Space Grotesk/Inter/JetBrains Mono, outlined headline, tech marquee.

**Tech Stack:** Hono 4 (jsx), TypeScript (strict), Zod, marked, Vitest, Wrangler, Cloudflare Workers (static assets via `[assets]`), vanilla JS for client filter.

## Global Constraints

- Node 20+ (repo ships `.nvmrc` = `20`; lab convention is `nvm use 20`).
- TypeScript strict mode; `tsc --noEmit` must pass.
- No client framework, no hydration, no database, no auth, no new dependencies beyond: `hono`, `marked`, `zod` (prod); `typescript`, `vitest`, `wrangler`, `@cloudflare/workers-types` (dev).
- All content fetched at runtime from `https://content.jovylle.com` — never hardcode content text in views; hero CTA links are the only curated exception (see Task 6).
- Relative thumbnails (`/images/...`) must be resolved to `https://content.jovylle.com/images/...` via `absoluteUrl()`.
- Every route handler is tested via `app.request()` with mock data. `npm test` must pass before any commit.
- Markdown output from blog posts is sanitized with the allowlist sanitizer in `src/lib/sanitize.ts`.
- Visual design must follow the spec: dark ink background, dot-grid + SVG noise + aurora blobs, outlined/alternating hero headline, marquee strip, section index numbers (`01`, `02`), hover-glow cards, `prefers-reduced-motion` respected.

## File Structure

```
craft/
├── package.json            # scripts: dev, deploy, test, typecheck
├── tsconfig.json           # strict, jsxImportSource: hono/jsx
├── wrangler.toml           # name=craft, main, [assets] ./public
├── vitest.config.ts        # esbuild jsx automatic + hono/jsx
├── .nvmrc                  # 20
├── .gitignore              # already created (node_modules, .wrangler, dist, .dev.vars, *.log, .DS_Store)
├── src/
│   ├── index.ts            # module-scope app singleton: createApp({ data: createDataClient() })
│   ├── app.ts              # createApp(data) — composes all route factories + 404/500 handlers
│   ├── routes/
│   │   ├── home.ts         # homeRoutes(data, baseUrl): GET /
│   │   ├── projects.ts     # projectsRoutes(data, baseUrl): GET /projects
│   │   ├── project-detail.ts # projectDetailRoutes(data, baseUrl): GET /projects/:slug
│   │   ├── blog.ts         # blogRoutes(data, baseUrl): GET /blog
│   │   └── post.ts         # postRoutes(data, baseUrl): GET /blog/:slug
│   ├── views/
│   │   ├── layout.tsx      # Layout, Header, Footer
│   │   ├── home.tsx        # HomeView
│   │   ├── projects.tsx    # ProjectsView (search input + tag bar + grid)
│   │   ├── project-detail.tsx # ProjectDetailView
│   │   ├── blog.tsx        # BlogView
│   │   ├── post.tsx        # PostView (markdown article)
│   │   └── not-found.tsx   # NotFoundView (used by all 404s + 500)
│   ├── components/
│   │   └── cards.tsx       # ProjectCard, PostCard
│   ├── data/
│   │   ├── schemas.ts      # Zod schemas + inferred types for all 6 endpoints
│   │   └── client.ts       # createDataClient(deps), DataClient interface, absoluteUrl, DEFAULT_BASE_URL
│   ├── lib/
│   │   ├── ttl-cache.ts    # TtlCache<T> with get/set/peek/clear
│   │   ├── markdown.ts     # renderMarkdown(md) — marked + sanitize
│   │   ├── sanitize.ts     # sanitizeHtml allowlist sanitizer
│   │   └── dates.ts        # formatDate(iso)
│   └── client/
│       └── project-filter.ts # applyFilter, collectTags (pure, shared with public/app.js semantics)
├── public/
│   ├── styles.css          # complete stylesheet (Task 5)
│   ├── app.js              # vanilla filter glue (Task 7)
│   ├── favicon.svg         # simple "c" mark
│   └── robots.txt
├── test/
│   ├── smoke.test.ts       # Task 1
│   ├── schemas.test.ts     # Task 2
│   ├── ttl-cache.test.ts   # Task 3
│   ├── client.test.ts      # Task 3
│   ├── sanitize.test.ts    # Task 4
│   ├── markdown.test.ts    # Task 4
│   ├── layout.test.ts      # Task 5
│   ├── home.test.ts        # Task 6
│   ├── project-filter.test.ts # Task 7
│   ├── projects.test.ts    # Task 7
│   ├── project-detail.test.ts # Task 8
│   ├── blog.test.ts        # Task 9
│   ├── post.test.ts        # Task 10
│   ├── fixtures.ts         # shared mock DataClient + fixtures (Task 6 onwards)
│   └── routes.test.ts      # Task 11 — full composition suite
├── .github/workflows/
│   ├── ci.yml              # Task 13: npm ci + typecheck + test
│   └── deploy.yml          # Task 13: wrangler deploy on main
└── README.md               # Task 13
```

---

### Task 1: Project scaffold + smoke test

**Files:**
- Create: `package.json`, `tsconfig.json`, `wrangler.toml`, `vitest.config.ts`, `.nvmrc`, `src/index.ts`, `test/smoke.test.ts`
- Test: `test/smoke.test.ts`

**Interfaces:**
- Produces: `npm test`/`npm run typecheck`/`npm run dev`/`npm run deploy` scripts; `src/index.ts` default export (Hono app).

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "craft",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  }
}
```

- [ ] **Step 2: Create `.nvmrc`, `tsconfig.json`, `wrangler.toml`, `vitest.config.ts`**

`.nvmrc`:
```
20
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "types": ["@cloudflare/workers-types"],
    "jsx": "react-jsx",
    "jsxImportSource": "hono/jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*", "test/**/*"]
}
```

`wrangler.toml`:
```toml
name = "craft"
main = "src/index.ts"
compatibility_date = "2026-07-31"

[assets]
directory = "./public"
```

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'hono/jsx',
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
})
```

- [ ] **Step 3: Create `src/index.ts`**

```ts
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => c.text('craft'))

export default app
```

- [ ] **Step 4: Create the failing test `test/smoke.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import app from '../src/index'

describe('smoke', () => {
  it('responds on /', async () => {
    const res = await app.request('/')
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('craft')
  })
})
```

- [ ] **Step 5: Install dependencies**

Run: `nvm use 20 && npm install hono marked zod && npm install -D typescript vitest wrangler @cloudflare/workers-types`
Expected: clean install, lockfile created.

- [ ] **Step 6: Run tests + typecheck**

Run: `npm test && npm run typecheck`
Expected: 1 passing test; `tsc` exits 0.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Hono + TypeScript + Vitest worker"
```

---

### Task 2: Zod schemas for all vault endpoints

**Files:**
- Create: `src/data/schemas.ts`
- Test: `test/schemas.test.ts`

**Interfaces:**
- Produces: `Homepage`, `Profile`, `Project`, `BlogPostSummary`, `BlogPost`, `Social` types and their Zod schemas — consumed by Tasks 3, 6-11.

- [ ] **Step 1: Write the failing test `test/schemas.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import {
  HomepageSchema,
  ProfileSchema,
  ProjectsSchema,
  BlogIndexSchema,
  BlogPostSchema,
  SocialSchema,
} from '../src/data/schemas'

const realHomepage = {
  hero: { title: "It's me, Jovylle", tagline: 'A Full-Stack Web Developer', description: 'Building modern web experiences with clean code and thoughtful design', githubHandle: 'jovylle' },
  ctas: [{ label: 'Get in touch', route: '/contact', variant: 'primary' }],
}

const realProject = {
  title: 'SFL Digging Assistant',
  description: 'Daily 300 Visitors. d1g.uk is a fast, free, and visual tool.',
  repo: 'https://github.com/jovylle/sfl-crab',
  updated_at: '2026-02-28T00:35:15Z',
  slug: 'sfl-crab',
  status: 'published',
  private: false,
  fav: true,
  priority_score: 600,
  tech: ['JS', 'Vue', 'Nuxt', 'Serverless'],
  links: [{ label: 'Repo', url: 'https://github.com/jovylle/sfl-crab' }],
  created_at: '2025-04-22T12:22:50Z',
  thumbnail: '/images/post/sfl-crab.png',
  language: 'JS, Vue, Nuxt, Serverless',
}

const realPostSummary = {
  slug: 'project-factory-500-autonomous-ai-apps',
  title: 'Project Factory: 500 Apps Built by Underpaid AI',
  date: '2026-07-17',
  excerpt: '500 small web apps built entirely by AI.',
  tags: ['ai', 'automation'],
  featured: true,
}

const realPost = {
  ...realPostSummary,
  author: 'Jovylle Bermudez',
  thumbnail: 'https://content.jovylle.com/images/post/factory-hero.png',
  content: '# Hello\n\nSome **markdown** body.',
}

const realSocial = {
  links: [
    { label: 'Email', url: 'mailto:me@jovylle.com', icon: 'email' },
    { label: 'GitHub', url: 'https://github.com/jovylle', icon: 'github' },
  ],
}

describe('schemas accept real vault payloads', () => {
  it('homepage', () => expect(HomepageSchema.parse(realHomepage).hero.title).toBe("It's me, Jovylle"))
  it('profile', () => expect(ProfileSchema.parse({ title: 'Full-Stack Web Developer', short_bio: 'Builds modern web experiences.', availability: 'Open to opportunities' }).short_bio).toContain('modern'))
  it('projects', () => expect(ProjectsSchema.parse({ projects: [realProject] }).projects[0].priority_score).toBe(600))
  it('blog index', () => expect(BlogIndexSchema.parse({ posts: [realPostSummary] }).posts[0].featured).toBe(true))
  it('blog post', () => expect(BlogPostSchema.parse(realPost).content).toContain('markdown'))
  it('social', () => expect(SocialSchema.parse(realSocial).links).toHaveLength(2))
})

describe('schemas reject malformed payloads', () => {
  it('project missing slug', () => {
    const bad = { ...realProject }
    delete (bad as { slug?: string }).slug
    expect(() => ProjectsSchema.parse({ projects: [bad] })).toThrow()
  })
  it('homepage missing hero.title', () => {
    expect(() => HomepageSchema.parse({ hero: { tagline: 'x' } })).toThrow()
  })
  it('post with non-string content', () => {
    expect(() => BlogPostSchema.parse({ ...realPost, content: 42 })).toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/schemas.test.ts`
Expected: FAIL — `Cannot find module '../src/data/schemas'`.

- [ ] **Step 3: Write `src/data/schemas.ts`**

```ts
import { z } from 'zod'

export const CtaSchema = z.object({
  label: z.string(),
  route: z.string().optional(),
  url: z.string().optional(),
  variant: z.string().optional(),
})

export const HomepageSchema = z.object({
  hero: z.object({
    title: z.string(),
    tagline: z.string(),
    description: z.string(),
    githubHandle: z.string(),
  }),
  ctas: z.array(CtaSchema).default([]),
})

export const ProfileSchema = z.object({
  title: z.string(),
  short_bio: z.string(),
  tone: z.string().optional(),
  contact_path: z.string().optional(),
  availability: z.string().optional(),
  last_edited: z.string().optional(),
})

export const ProjectLinkSchema = z.object({
  label: z.string(),
  url: z.string(),
})

export const ProjectSchema = z.object({
  title: z.string(),
  description: z.string().default(''),
  repo: z.string().optional(),
  updated_at: z.string().optional(),
  slug: z.string(),
  status: z.string().optional(),
  private: z.boolean().optional().default(false),
  fav: z.boolean().optional().default(false),
  priority_score: z.number().optional().default(0),
  tech: z.array(z.string()).default([]),
  links: z.array(ProjectLinkSchema).default([]),
  created_at: z.string().optional(),
  thumbnail: z.string().default(''),
  language: z.string().optional().default(''),
})

export const ProjectsSchema = z.object({
  projects: z.array(ProjectSchema).default([]),
})

export const BlogPostSummarySchema = z.object({
  slug: z.string(),
  title: z.string(),
  date: z.string().default(''),
  excerpt: z.string().default(''),
  tags: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
})

export const BlogIndexSchema = z.object({
  posts: z.array(BlogPostSummarySchema).default([]),
})

export const BlogPostSchema = z.object({
  slug: z.string(),
  title: z.string(),
  date: z.string().default(''),
  excerpt: z.string().default(''),
  author: z.string().default(''),
  tags: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  thumbnail: z.string().default(''),
  content: z.string().default(''),
  status: z.string().optional(),
})

export const SocialLinkSchema = z.object({
  label: z.string(),
  url: z.string(),
  icon: z.string().optional(),
})

export const SocialSchema = z.object({
  links: z.array(SocialLinkSchema).default([]),
})

export type Homepage = z.infer<typeof HomepageSchema>
export type Profile = z.infer<typeof ProfileSchema>
export type Project = z.infer<typeof ProjectSchema>
export type BlogPostSummary = z.infer<typeof BlogPostSummarySchema>
export type BlogPost = z.infer<typeof BlogPostSchema>
export type Social = z.infer<typeof SocialSchema>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run test/schemas.test.ts && npm run typecheck`
Expected: PASS (all 9 schema tests); `tsc` exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/data/schemas.ts test/schemas.test.ts
git commit -m "feat: zod schemas for all content vault endpoints"
```

---

### Task 3: TTL cache + data client (DI, caching, fallback)

**Files:**
- Create: `src/lib/ttl-cache.ts`, `src/data/client.ts`
- Test: `test/ttl-cache.test.ts`, `test/client.test.ts`

**Interfaces:**
- Produces: `class TtlCache<T> { get(key): T|undefined; set(key, value): void; peek(key): T|undefined; clear(): void }`
- Produces: `interface DataClient { getHomepage(): Promise<Homepage>; getProfile(): Promise<Profile>; getProjects(): Promise<Project[]>; getBlogIndex(): Promise<BlogPostSummary[]>; getPost(slug: string): Promise<BlogPost | undefined>; getSocial(): Promise<Social> }`
- Produces: `createDataClient(deps?: { fetchFn?: typeof fetch; baseUrl?: string; cacheTtlMs?: number; cache?: TtlCache<unknown> }): DataClient`
- Produces: `absoluteUrl(raw: string, baseUrl: string): string` and `DEFAULT_BASE_URL = 'https://content.jovylle.com'`
- Consumes: schemas from Task 2.

- [ ] **Step 1: Write the failing tests**

`test/ttl-cache.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { TtlCache } from '../src/lib/ttl-cache'

describe('TtlCache', () => {
  it('returns undefined for a missing key', () => {
    const cache = new TtlCache<string>(1000)
    expect(cache.get('nope')).toBeUndefined()
  })

  it('returns the value before expiry and clears it after', () => {
    let now = 0
    const cache = new TtlCache<string>(1000, () => now)
    cache.set('k', 'v')
    expect(cache.get('k')).toBe('v')
    now = 1001
    expect(cache.get('k')).toBeUndefined()
  })

  it('peek returns stale values without deleting them', () => {
    let now = 0
    const cache = new TtlCache<string>(1000, () => now)
    cache.set('k', 'v')
    now = 5000
    expect(cache.peek('k')).toBe('v')
    expect(cache.get('k')).toBeUndefined()
  })

  it('clear removes everything', () => {
    const cache = new TtlCache<string>(1000)
    cache.set('a', '1')
    cache.set('b', '2')
    cache.clear()
    expect(cache.get('a')).toBeUndefined()
    expect(cache.get('b')).toBeUndefined()
  })
})
```

`test/client.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest'
import { createDataClient, absoluteUrl } from '../src/data/client'

const homepageFixture = {
  hero: { title: "It's me, Jovylle", tagline: 'A Full-Stack Web Developer', description: 'Building modern web experiences with clean code and thoughtful design', githubHandle: 'jovylle' },
  ctas: [],
}

const projectsFixture = {
  projects: [
    {
      title: 'SFL Digging Assistant',
      description: 'Daily 300 Visitors.',
      slug: 'sfl-crab',
      thumbnail: '/images/post/sfl-crab.png',
      tech: ['Vue', 'Nuxt'],
    },
  ],
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } })
}

describe('createDataClient', () => {
  it('fetches and validates an endpoint', async () => {
    const fetchFn = vi.fn(async () => jsonResponse(homepageFixture))
    const client = createDataClient({ fetchFn, baseUrl: 'https://content.jovylle.com' })
    const homepage = await client.getHomepage()
    expect(homepage.hero.title).toBe("It's me, Jovylle")
    expect(fetchFn).toHaveBeenCalledWith('https://content.jovylle.com/data/homepage.json')
  })

  it('serves the second call from cache without refetching', async () => {
    const fetchFn = vi.fn(async () => jsonResponse(homepageFixture))
    const client = createDataClient({ fetchFn })
    await client.getHomepage()
    await client.getHomepage()
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  it('normalizes relative project thumbnails to absolute URLs', async () => {
    const fetchFn = vi.fn(async () => jsonResponse(projectsFixture))
    const client = createDataClient({ fetchFn, baseUrl: 'https://content.jovylle.com' })
    const projects = await client.getProjects()
    expect(projects[0].thumbnail).toBe('https://content.jovylle.com/images/post/sfl-crab.png')
  })

  it('throws on non-2xx responses', async () => {
    const fetchFn = vi.fn(async () => new Response('boom', { status: 500 }))
    const client = createDataClient({ fetchFn })
    await expect(client.getProfile()).rejects.toThrow('failed')
  })

  it('throws on malformed payloads', async () => {
    const fetchFn = vi.fn(async () => jsonResponse({ wrong: true }))
    const client = createDataClient({ fetchFn })
    await expect(client.getProjects()).rejects.toThrow()
  })

  it('returns stale cached data when the network fails after expiry', async () => {
    let now = 0
    const fetchFn = vi
      .fn()
      .mockImplementationOnce(async () => jsonResponse(homepageFixture))
      .mockImplementationOnce(async () => new Response('down', { status: 503 }))
    const client = createDataClient({ fetchFn, cacheTtlMs: 1000, now: () => now } as never)
    await client.getHomepage()
    now = 2000 // expire
    const result = await client.getHomepage() // fetch fails → stale fallback
    expect(result.hero.title).toBe("It's me, Jovylle")
  })

  it('getPost returns undefined for an unknown slug', async () => {
    const fetchFn = vi.fn(async () => new Response('not found', { status: 404 }))
    const client = createDataClient({ fetchFn })
    await expect(client.getPost('ghost')).resolves.toBeUndefined()
  })

  it('getPost returns the parsed post for a known slug', async () => {
    const post = { slug: 'hello', title: 'Hello', content: '# Hi' }
    const fetchFn = vi.fn(async () => jsonResponse(post))
    const client = createDataClient({ fetchFn })
    const result = await client.getPost('hello')
    expect(result?.title).toBe('Hello')
    expect(fetchFn).toHaveBeenCalledWith('https://content.jovylle.com/data/blogs/hello.json')
  })
})

describe('absoluteUrl', () => {
  it('keeps absolute URLs', () => expect(absoluteUrl('https://x.com/a.png', 'https://content.jovylle.com')).toBe('https://x.com/a.png'))
  it('prefixes root-relative URLs', () => expect(absoluteUrl('/images/a.png', 'https://content.jovylle.com')).toBe('https://content.jovylle.com/images/a.png'))
  it('prefixes bare paths', () => expect(absoluteUrl('images/a.png', 'https://content.jovylle.com')).toBe('https://content.jovylle.com/images/a.png'))
  it('returns empty string for empty input', () => expect(absoluteUrl('', 'https://content.jovylle.com')).toBe(''))
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run test/ttl-cache.test.ts test/client.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write `src/lib/ttl-cache.ts`**

```ts
interface CacheEntry<T> {
  value: T
  expiresAt: number
}

export class TtlCache<T> {
  private store = new Map<string, CacheEntry<T>>()

  constructor(
    private ttlMs: number,
    private now: () => number = () => Date.now(),
  ) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key)
    if (!entry) return undefined
    if (entry.expiresAt <= this.now()) {
      this.store.delete(key)
      return undefined
    }
    return entry.value
  }

  set(key: string, value: T): void {
    this.store.set(key, { value, expiresAt: this.now() + this.ttlMs })
  }

  /** Return a possibly-expired value without deleting it (for stale fallback). */
  peek(key: string): T | undefined {
    return this.store.get(key)?.value
  }

  clear(): void {
    this.store.clear()
  }
}
```

- [ ] **Step 4: Write `src/data/client.ts`**

```ts
import type { z } from 'zod'
import {
  HomepageSchema,
  ProfileSchema,
  ProjectsSchema,
  BlogIndexSchema,
  BlogPostSchema,
  SocialSchema,
} from './schemas'
import type { Homepage, Profile, Project, BlogPostSummary, BlogPost, Social } from './schemas'
import { TtlCache } from '../lib/ttl-cache'

export const DEFAULT_BASE_URL = 'https://content.jovylle.com'

export interface DataClient {
  getHomepage(): Promise<Homepage>
  getProfile(): Promise<Profile>
  getProjects(): Promise<Project[]>
  getBlogIndex(): Promise<BlogPostSummary[]>
  getPost(slug: string): Promise<BlogPost | undefined>
  getSocial(): Promise<Social>
}

export interface DataClientDeps {
  fetchFn?: typeof fetch
  baseUrl?: string
  cacheTtlMs?: number
  cache?: TtlCache<unknown>
  now?: () => number
}

const ENDPOINTS = {
  homepage: '/data/homepage.json',
  profile: '/data/profile.json',
  projects: '/data/personal-projects.json',
  blogIndex: '/data/blogs/index.json',
  social: '/data/social.json',
} as const

export function absoluteUrl(raw: string, baseUrl: string): string {
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) return raw
  if (raw.startsWith('/')) return `${baseUrl}${raw}`
  return `${baseUrl}/${raw}`
}

export function createDataClient(deps: DataClientDeps = {}): DataClient {
  const { fetchFn = fetch, baseUrl = DEFAULT_BASE_URL, cacheTtlMs = 300_000, now } = deps
  const cache = deps.cache ?? new TtlCache<unknown>(cacheTtlMs, now)

  async function getJson<T>(path: string, schema: z.ZodType<T>, key: string): Promise<T> {
    const hit = cache.get(key)
    if (hit) return hit as T
    const url = `${baseUrl}${path}`
    const res = await fetchFn(url)
    if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`)
    const parsed = schema.parse(await res.json())
    cache.set(key, parsed)
    return parsed
  }

  async function getJsonWithFallback<T>(path: string, schema: z.ZodType<T>, key: string): Promise<T> {
    try {
      return await getJson(path, schema, key)
    } catch (err) {
      const stale = cache.peek(key)
      if (stale !== undefined) return stale as T
      throw err
    }
  }

  return {
    getHomepage: () => getJsonWithFallback(ENDPOINTS.homepage, HomepageSchema, 'homepage'),
    getProfile: () => getJsonWithFallback(ENDPOINTS.profile, ProfileSchema, 'profile'),
    async getProjects() {
      const { projects } = await getJsonWithFallback(ENDPOINTS.projects, ProjectsSchema, 'projects')
      return projects.map((p) => ({ ...p, thumbnail: absoluteUrl(p.thumbnail, baseUrl) }))
    },
    getBlogIndex: async () => {
      const { posts } = await getJsonWithFallback(ENDPOINTS.blogIndex, BlogIndexSchema, 'blogIndex')
      return posts
    },
    async getPost(slug) {
      try {
        const post = await getJsonWithFallback(`/data/blogs/${slug}.json`, BlogPostSchema, `post:${slug}`)
        return { ...post, thumbnail: absoluteUrl(post.thumbnail, baseUrl) }
      } catch (err) {
        if (err instanceof Error && err.message.includes('404')) return undefined
        throw err
      }
    },
    getSocial: () => getJsonWithFallback(ENDPOINTS.social, SocialSchema, 'social'),
  }
}
```

> Note: `now` is accepted in `DataClientDeps` and forwarded to the default cache so tests can control expiry without injecting a cache.

- [ ] **Step 5: Run tests + typecheck**

Run: `npx vitest run test/ttl-cache.test.ts test/client.test.ts && npm run typecheck`
Expected: PASS (4 TtlCache + 8 client tests); `tsc` exits 0.

- [ ] **Step 6: Commit**

```bash
git add src/lib/ttl-cache.ts src/data/client.ts test/ttl-cache.test.ts test/client.test.ts
git commit -m "feat: data client with DI fetch, zod validation, ttl cache and stale fallback"
```

---

### Task 4: Markdown renderer + HTML sanitizer

**Files:**
- Create: `src/lib/sanitize.ts`, `src/lib/markdown.ts`
- Test: `test/sanitize.test.ts`, `test/markdown.test.ts`

**Interfaces:**
- Produces: `sanitizeHtml(html: string): string` — allowlist sanitizer.
- Produces: `renderMarkdown(markdown: string): Promise<string>` — `marked.parse` (gfm, breaks) then `sanitizeHtml`.
- Consumed by: Task 10 (`post.tsx`).

- [ ] **Step 1: Write the failing tests**

`test/sanitize.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { sanitizeHtml } from '../src/lib/sanitize'

describe('sanitizeHtml', () => {
  it('keeps allowed formatting', () => {
    const html = '<h2>Title</h2><p>Hello <strong>bold</strong> and <a href="https://x.com">link</a>.</p>'
    expect(sanitizeHtml(html)).toBe('<h2>Title</h2><p>Hello <strong>bold</strong> and <a href="https://x.com">link</a>.</p>')
  })

  it('drops script blocks including their content', () => {
    expect(sanitizeHtml('<p>ok</p><script>alert(1)</script><p>after</p>')).toBe('<p>ok</p><p>after</p>')
  })

  it('drops style and iframe', () => {
    expect(sanitizeHtml('<style>body{}</style><iframe src="https://evil"></iframe><p>x</p>')).toBe('<p>x</p>')
  })

  it('strips dangerous attributes', () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)" onclick="x()">bad</a>')).toBe('<a>bad</a>')
  })

  it('blocks javascript: links on img', () => {
    expect(sanitizeHtml('<img src="javascript:alert(1)">')).toBe('')
  })

  it('removes comments', () => {
    expect(sanitizeHtml('<p>a</p><!-- comment --><p>b</p>')).toBe('<p>a</p><p>b</p>')
  })

  it('escapes attribute values', () => {
    expect(sanitizeHtml('<a href="https://x.com?a=1&amp;b=2">x</a>')).toBe('<a href="https://x.com?a=1&amp;b=2">x</a>')
  })

  it('keeps markdown-generated structure', () => {
    const html = '<ul><li>one</li><li>two</li></ul><pre><code class="language-ts">const x = 1</code></pre>'
    expect(sanitizeHtml(html)).toBe(html)
  })
})
```

`test/markdown.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { renderMarkdown } from '../src/lib/markdown'

describe('renderMarkdown', () => {
  it('renders headings, bold and links', async () => {
    const html = await renderMarkdown('# Title\n\nSome **bold** text and a [link](https://x.com).')
    expect(html).toContain('<h1>Title</h1>')
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('<a href="https://x.com">link</a>')
  })

  it('renders code blocks and tables', async () => {
    const html = await renderMarkdown('```ts\nconst x = 1\n```\n\n| a | b |\n|---|---|\n| 1 | 2 |')
    expect(html).toContain('<pre><code class="language-ts">')
    expect(html).toContain('<table>')
    expect(html).toContain('<td>1</td>')
  })

  it('sanitizes raw html from the markdown source', async () => {
    const html = await renderMarkdown('hello\n\n<script>alert(1)</script>')
    expect(html).not.toContain('<script>')
    expect(html).toContain('hello')
  })

  it('breaks on single newlines', async () => {
    const html = await renderMarkdown('line one\nline two')
    expect(html).toContain('line one<br>')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run test/sanitize.test.ts test/markdown.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write `src/lib/sanitize.ts`**

```ts
const ALLOWED_TAGS = new Set([
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'ul', 'ol', 'li', 'code', 'pre',
  'blockquote', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'strong', 'em', 'img',
  'hr', 'br', 'span', 'del', 'sup', 'sub',
])

const DROP_TAGS = new Set([
  'script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button',
  'textarea', 'select', 'option', 'link', 'meta', 'noscript', 'template',
])

const VOID_TAGS = new Set(['br', 'hr', 'img'])

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href']),
  img: new Set(['src', 'alt', 'title']),
  code: new Set(['class']),
  span: new Set(['class']),
  th: new Set(['align']),
  td: new Set(['align']),
}

function parseAttrs(raw: string): Record<string, string> {
  const out: Record<string, string> = {}
  const re = /([a-zA-Z-]+)\s*=\s*("[^"]*"|'[^']*')/g
  let m: RegExpExecArray | null
  while ((m = re.exec(raw)) !== null) {
    out[m[1].toLowerCase()] = m[2].slice(1, -1)
  }
  return out
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Allowlist HTML sanitizer: keeps safe markdown-generated markup, drops everything else. */
export function sanitizeHtml(html: string): string {
  const tokenRe = /<!--[\s\S]*?-->|<\/?[a-zA-Z][^>]*>|[^<]+/g
  const stack: string[] = []
  let out = ''
  let match: RegExpExecArray | null

  while ((match = tokenRe.exec(html)) !== null) {
    const token = match[0]
    if (token.startsWith('<!--')) continue

    if (token.startsWith('</')) {
      const tag = token.slice(2, token.length - 1).trim().split(/\s/)[0].toLowerCase()
      if (stack.includes(tag)) {
        while (stack.length && stack[stack.length - 1] !== tag) {
          const t = stack.pop() as string
          if (!DROP_TAGS.has(t)) out += `</${t}>`
        }
        const popped = stack.pop()
        if (popped && !DROP_TAGS.has(popped)) out += `</${popped}>`
      }
      continue
    }

    if (token.startsWith('<')) {
      const m = /^<([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^'">])*)>$/.exec(token)
      if (!m) continue
      const tag = m[1].toLowerCase()
      if (DROP_TAGS.has(tag)) {
        stack.push(tag)
        continue
      }
      if (!ALLOWED_TAGS.has(tag)) continue
      const attrs = parseAttrs(m[2])
      if (tag === 'a' || tag === 'img') {
        const url = attrs.href ?? attrs.src ?? ''
        if (!/^(https?:|mailto:)/i.test(url)) continue
      }
      const keep: string[] = []
      for (const [k, v] of Object.entries(attrs)) {
        if (ALLOWED_ATTRS[tag]?.has(k)) keep.push(`${k}="${escapeAttr(v)}"`)
      }
      out += `<${tag}${keep.length ? ' ' + keep.join(' ') : ''}>`
      if (!VOID_TAGS.has(tag)) stack.push(tag)
      continue
    }

    if (stack.length && DROP_TAGS.has(stack[stack.length - 1])) continue
    out += token
  }

  while (stack.length) {
    const t = stack.pop() as string
    if (!DROP_TAGS.has(t)) out += `</${t}>`
  }
  return out
}
```

- [ ] **Step 4: Write `src/lib/markdown.ts`**

```ts
import { marked } from 'marked'
import { sanitizeHtml } from './sanitize'

export async function renderMarkdown(markdown: string): Promise<string> {
  const raw = await marked.parse(markdown, { gfm: true, breaks: true })
  return sanitizeHtml(raw)
}
```

- [ ] **Step 5: Run tests + typecheck**

Run: `npx vitest run test/sanitize.test.ts test/markdown.test.ts && npm run typecheck`
Expected: PASS (8 sanitize + 4 markdown tests); `tsc` exits 0.

- [ ] **Step 6: Commit**

```bash
git add src/lib/sanitize.ts src/lib/markdown.ts test/sanitize.test.ts test/markdown.test.ts
git commit -m "feat: markdown renderer with allowlist sanitizer"
```

---

### Task 5: Layout shell, header/footer, and the full stylesheet

**Files:**
- Create: `src/views/layout.tsx`, `src/lib/dates.ts`, `public/styles.css`, `public/favicon.svg`, `public/robots.txt`
- Test: `test/layout.test.ts`, `test/dates.test.ts`

**Interfaces:**
- Produces: `<Layout title description path socialLinks={SocialLink[]} children>` — full HTML shell with backdrop, header, footer, font links, `/styles.css`, `/app.js`.
- Produces: `formatDate(iso: string): string` (e.g. `"Jul 17, 2026"`).
- Consumed by: all views (Tasks 6-10).

- [ ] **Step 1: Write the failing tests**

`test/dates.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { formatDate } from '../src/lib/dates'

describe('formatDate', () => {
  it('formats an ISO date', () => expect(formatDate('2026-07-17')).toBe('Jul 17, 2026'))
  it('formats a datetime string', () => expect(formatDate('2026-02-28T00:35:15Z')).toContain('Feb 28, 2026'))
  it('returns empty for empty input', () => expect(formatDate('')).toBe(''))
  it('returns the raw value when unparseable', () => expect(formatDate('soon')).toBe('soon'))
})
```

`test/layout.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { Layout } from '../src/views/layout'
import { render } from '../src/lib/test-render'

describe('Layout', () => {
  it('renders the html shell with title, fonts, stylesheet and script', () => {
    const html = render(<Layout title="Home" description="desc" path="/" socialLinks={[{ label: 'GitHub', url: 'https://github.com/jovylle' }]}><p>content</p></Layout>)
    expect(html).toContain('<!doctype html>')
    expect(html).toContain('<title>Home — craft</title>')
    expect(html).toContain('fonts.googleapis.com')
    expect(html).toContain('href="/styles.css"')
    expect(html).toContain('src="/app.js"')
    expect(html).toContain('class="aurora')
    expect(html).toContain('Skip to content')
    expect(html).toContain('<p>content</p>')
    expect(html).toContain('https://github.com/jovylle')
  })

  it('marks the active nav link', () => {
    const html = render(<Layout title="Projects" description="" path="/projects" socialLinks={[]}><p>x</p></Layout>)
    expect(html).toContain('class="nav-link active"')
    expect(html).toContain('href="/projects"')
  })
})
```

> The `render` helper — create `src/lib/test-render.tsx` (JSX renderer used only by tests):
> ```tsx
> import { createElement } from 'hono/jsx'
> import type { Child } from 'hono/jsx'
>
> export function render(node: Child): string {
>   return createElement('html', null, node) as unknown as string
> }
> ```
> Simpler alternative that always works: use `hono/jsx-dom`? Not available. Use this instead — Hono's JSX runtime `createElement` returns a string when rendered via `toString()`:
> ```tsx
> import { jsx } from 'hono/jsx'
> export function render(node: unknown): string {
>   return (jsx('div', { children: node }) as unknown as { toString(): string }).toString()
> }
> ```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run test/dates.test.ts test/layout.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write `src/lib/dates.ts`**

```ts
export function formatDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
```

- [ ] **Step 4: Write `src/lib/test-render.tsx`**

```tsx
import { jsx } from 'hono/jsx'

/** Render a Hono JSX node to an HTML string (test helper). */
export function render(node: unknown): string {
  const el = jsx('div', { children: node }) as unknown as { toString(): string }
  return el.toString()
}
```

- [ ] **Step 5: Write `src/views/layout.tsx`**

```tsx
import type { Child } from 'hono/jsx'
import type { SocialLink } from '../data/schemas'

const FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap'

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/projects', label: 'Projects' },
  { href: '/blog', label: 'Blog' },
]

function isActive(path: string, href: string): boolean {
  if (href === '/') return path === '/'
  return path === href || path.startsWith(href + '/')
}

interface HeaderProps {
  path: string
}

function Header({ path }: HeaderProps) {
  return (
    <header class="site-header">
      <a class="brand" href="/">
        craft<span class="brand-dot">.</span>
      </a>
      <nav class="site-nav" aria-label="Primary">
        {NAV.map((item) => (
          <a href={item.href} class={isActive(path, item.href) ? 'nav-link active' : 'nav-link'}>
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  )
}

interface FooterProps {
  socialLinks: SocialLink[]
}

function Footer({ socialLinks }: FooterProps) {
  return (
    <footer class="site-footer">
      <p class="footer-note">
        © {new Date().getFullYear()} Jovylle · Built with Hono on Cloudflare Workers
      </p>
      <div class="footer-social">
        {socialLinks.map((link) => (
          <a class="social-link" href={link.url} rel="noopener noreferrer" key={link.label}>
            {link.label}
          </a>
        ))}
      </div>
    </footer>
  )
}

export interface LayoutProps {
  title: string
  description?: string
  path: string
  socialLinks?: SocialLink[]
  children?: Child
}

export function Layout({ title, description = '', path, socialLinks = [], children }: LayoutProps) {
  return (
    <>
      {html`<!doctype html>`}
      <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title} — craft</title>
        <meta name="description" content={description} />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
        <link href={FONTS_URL} rel="stylesheet" />
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
        <div class="aurora aurora--a" aria-hidden="true" />
        <div class="aurora aurora--b" aria-hidden="true" />
        <a class="skip-link" href="#main">
          Skip to content
        </a>
        <Header path={path} />
        <main id="main">{children}</main>
        <Footer socialLinks={socialLinks} />
        <script src="/app.js" defer />
      </body>
      </html>
    </>
  )
}
```

> Note: `Layout` now uses a fragment (`<>`) plus `html` from `hono/html` to emit the doctype. Add the import at the top of `layout.tsx`:
> ```ts
> import { html } from 'hono/html'
> ```
> The closing tags align with the fragment — the component body ends with `</html>` then `</>`, as written above.

- [ ] **Step 6: Write `public/styles.css` (complete stylesheet)**

```css
/* ============ Tokens ============ */
:root {
  --bg: #070b12;
  --surface: #0c1320;
  --surface-2: #101a2b;
  --border: rgba(148, 163, 184, 0.14);
  --text: #e6edf7;
  --muted: #93a4bf;
  --accent-1: #67e8f9;
  --accent-2: #a78bfa;
  --accent-3: #f472b6;
  --gradient: linear-gradient(120deg, var(--accent-1), var(--accent-2) 55%, var(--accent-3));
  --font-display: 'Space Grotesk', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
  --radius: 14px;
  --max-width: 1120px;
  --nav-h: 64px;
}

/* ============ Base ============ */
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  font-family: var(--font-body);
  background: var(--bg);
  color: var(--text);
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}
a { color: var(--accent-1); text-decoration: none; }
a:hover { text-decoration: underline; text-underline-offset: 3px; }
::selection { background: rgba(167, 139, 250, 0.35); }

/* ============ Layered backdrop ============ */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -3;
  background-image: radial-gradient(rgba(148, 163, 184, 0.12) 1px, transparent 1px);
  background-size: 30px 30px;
  -webkit-mask-image: radial-gradient(ellipse 90% 65% at 50% 0%, black 25%, transparent 100%);
  mask-image: radial-gradient(ellipse 90% 65% at 50% 0%, black 25%, transparent 100%);
}
body::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -2;
  pointer-events: none;
  opacity: 0.05;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
.aurora {
  position: fixed;
  z-index: -1;
  border-radius: 50%;
  filter: blur(120px);
  pointer-events: none;
}
.aurora--a {
  width: 640px;
  height: 640px;
  top: -180px;
  left: -160px;
  opacity: 0.32;
  background: radial-gradient(circle, rgba(103, 232, 249, 0.55), transparent 70%);
  animation: drift-a 22s ease-in-out infinite alternate;
}
.aurora--b {
  width: 560px;
  height: 560px;
  bottom: -200px;
  right: -140px;
  opacity: 0.28;
  background: radial-gradient(circle, rgba(167, 139, 250, 0.5), transparent 70%);
  animation: drift-b 28s ease-in-out infinite alternate;
}
@keyframes drift-a { to { transform: translate(120px, 90px) scale(1.15); } }
@keyframes drift-b { to { transform: translate(-100px, -70px) scale(1.1); } }

/* ============ Accessibility ============ */
.skip-link {
  position: absolute;
  left: -9999px;
  top: 0;
  z-index: 100;
  background: var(--accent-1);
  color: #04121a;
  padding: 0.5rem 1rem;
  font-weight: 600;
  border-radius: 0 0 8px 0;
}
.skip-link:focus { left: 0; }

/* ============ Header ============ */
.site-header {
  position: sticky;
  top: 0;
  z-index: 50;
  height: var(--nav-h);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 clamp(1.25rem, 4vw, 2.5rem);
  background: rgba(7, 11, 18, 0.72);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--border);
}
.brand {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.35rem;
  letter-spacing: -0.02em;
  color: var(--text);
}
.brand:hover { text-decoration: none; }
.brand-dot { color: var(--accent-1); }
.site-nav { display: flex; gap: 1.75rem; }
.nav-link {
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: var(--muted);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  position: relative;
}
.nav-link:hover { color: var(--text); text-decoration: none; }
.nav-link.active { color: var(--accent-1); }
.nav-link.active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -6px;
  height: 2px;
  background: var(--gradient);
  border-radius: 2px;
}

/* ============ Layout containers ============ */
.wrap { max-width: var(--max-width); margin: 0 auto; padding: 0 clamp(1.25rem, 4vw, 2.5rem); }
.section { padding-block: 4.5rem; }

/* ============ Hero ============ */
.hero {
  min-height: calc(100svh - var(--nav-h));
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1.5rem;
  padding-block: 3rem;
  position: relative;
}
.hero-kicker {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-family: var(--font-mono);
  font-size: 0.82rem;
  color: var(--muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.status-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #34d399;
  box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.6);
  animation: pulse 2.4s ease-out infinite;
}
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.55); }
  70% { box-shadow: 0 0 0 9px rgba(52, 211, 153, 0); }
  100% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0); }
}
.hero-title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(3rem, 8vw, 6.25rem);
  line-height: 0.98;
  letter-spacing: -0.03em;
  margin: 0;
}
.hero-title .outline {
  color: transparent;
  -webkit-text-stroke: 1.5px var(--text);
}
.hero-title .accent {
  background: var(--gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.hero-tagline {
  font-family: var(--font-display);
  font-size: clamp(1.15rem, 2.4vw, 1.6rem);
  color: var(--accent-1);
  margin: 0;
}
.hero-desc { max-width: 54ch; color: var(--muted); font-size: 1.05rem; margin: 0; }
.hero-ctas { display: flex; flex-wrap: wrap; gap: 0.9rem; margin-top: 0.5rem; }

/* ============ Buttons ============ */
.btn {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: 0.85rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  padding: 0.7rem 1.3rem;
  border-radius: 999px;
  border: 1px solid transparent;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}
.btn:hover { text-decoration: none; transform: translateY(-2px); }
.btn--primary {
  background: var(--gradient);
  color: #04121a;
  font-weight: 600;
}
.btn--primary:hover { box-shadow: 0 8px 28px -8px rgba(103, 232, 249, 0.55); }
.btn--ghost { border-color: var(--border); color: var(--text); background: rgba(255, 255, 255, 0.03); }
.btn--ghost:hover { border-color: rgba(103, 232, 249, 0.5); box-shadow: 0 8px 24px -10px rgba(103, 232, 249, 0.35); }

/* ============ Marquee ============ */
.marquee {
  overflow: hidden;
  border-block: 1px solid var(--border);
  padding-block: 0.85rem;
  background: rgba(12, 19, 32, 0.5);
}
.marquee-track {
  display: flex;
  gap: 3.25rem;
  width: max-content;
  animation: marquee 36s linear infinite;
}
.marquee:hover .marquee-track { animation-play-state: paused; }
.marquee-track span {
  font-family: var(--font-mono);
  font-size: 0.82rem;
  color: var(--muted);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  white-space: nowrap;
}
.marquee-track span::before { content: '◆ '; color: var(--accent-2); }
@keyframes marquee { to { transform: translateX(-50%); } }

/* ============ Section heads ============ */
.section-head { display: flex; align-items: baseline; gap: 1rem; margin-bottom: 2.25rem; }
.section-index { font-family: var(--font-mono); color: var(--accent-1); font-size: 0.9rem; }
.section-title { font-family: var(--font-display); font-size: clamp(1.5rem, 3vw, 2.2rem); margin: 0; }
.section-link { font-family: var(--font-mono); font-size: 0.8rem; margin-left: auto; }

/* ============ Grids ============ */
.grid { display: grid; gap: 1.25rem; }
.grid--projects { grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
.grid--posts { grid-template-columns: repeat(auto-fill, minmax(310px, 1fr)); }

/* ============ Cards ============ */
.card {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0.012));
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.1rem;
  color: var(--text);
  transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
}
.card:hover {
  transform: translateY(-4px);
  border-color: rgba(103, 232, 249, 0.45);
  box-shadow: 0 14px 44px -14px rgba(103, 232, 249, 0.28);
  text-decoration: none;
}
.card-thumb-wrap { border-radius: calc(var(--radius) - 6px); overflow: hidden; }
.card-thumb { display: block; width: 100%; aspect-ratio: 16 / 9; object-fit: cover; transition: transform 0.4s ease; }
.card:hover .card-thumb { transform: scale(1.05); }
.card-thumb--empty {
  aspect-ratio: 16 / 9;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, var(--surface-2), var(--bg));
  border: 1px dashed var(--border);
  border-radius: calc(var(--radius) - 6px);
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.card-body { display: flex; flex-direction: column; gap: 0.55rem; flex: 1; }
.card-title { font-family: var(--font-display); font-size: 1.15rem; margin: 0; line-height: 1.3; }
.card-desc {
  color: var(--muted);
  font-size: 0.92rem;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ============ Chips & tags ============ */
.chip-row { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: auto; }
.chip {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--muted);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 0.2rem 0.6rem;
  letter-spacing: 0.03em;
}
.tag--featured {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #04121a;
  background: var(--gradient);
  border-radius: 999px;
  padding: 0.18rem 0.55rem;
}
.post-meta { display: flex; align-items: center; gap: 0.7rem; }
.post-date { font-family: var(--font-mono); font-size: 0.75rem; color: var(--muted); }

/* ============ Projects page tools ============ */
.toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; margin-bottom: 2rem; }
.search-box {
  flex: 1 1 260px;
  max-width: 420px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 0.85rem;
  padding: 0.65rem 1.1rem;
  outline: none;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}
.search-box:focus { border-color: rgba(103, 232, 249, 0.6); box-shadow: 0 0 0 3px rgba(103, 232, 249, 0.15); }
.tag-bar { display: flex; flex-wrap: wrap; gap: 0.45rem; }
.tag-btn {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--muted);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 0.3rem 0.75rem;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}
.tag-btn:hover { color: var(--text); border-color: rgba(103, 232, 249, 0.4); }
.tag-btn.active { color: #04121a; background: var(--gradient); border-color: transparent; }
.page-intro { max-width: 60ch; color: var(--muted); margin: 0 0 2rem; }
.empty-state { color: var(--muted); font-family: var(--font-mono); padding: 3rem 0; text-align: center; }

/* ============ Detail pages ============ */
.back-link { font-family: var(--font-mono); font-size: 0.8rem; color: var(--muted); }
.detail-hero { padding-block: 3rem 2rem; }
.detail-title { font-family: var(--font-display); font-size: clamp(2rem, 5vw, 3.4rem); line-height: 1.05; letter-spacing: -0.02em; margin: 1rem 0 0.75rem; }
.detail-desc { max-width: 62ch; color: var(--muted); font-size: 1.05rem; margin: 0 0 1.5rem; }
.detail-meta { display: flex; flex-wrap: wrap; gap: 1.75rem; margin-block: 1.5rem; }
.meta-item { display: flex; flex-direction: column; gap: 0.2rem; }
.meta-label { font-family: var(--font-mono); font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); }
.meta-value { font-family: var(--font-mono); font-size: 0.85rem; color: var(--text); }
.link-row { display: flex; flex-wrap: wrap; gap: 0.7rem; margin-block: 1.5rem; }
.detail-thumb { width: 100%; max-width: 860px; border-radius: var(--radius); border: 1px solid var(--border); margin-block: 1rem; display: block; }

/* ============ Article (blog post) ============ */
.article { max-width: 760px; margin: 0 auto; padding-bottom: 4rem; }
.article-header { padding-block: 3rem 1.5rem; }
.article-title { font-family: var(--font-display); font-size: clamp(1.9rem, 4.5vw, 3rem); line-height: 1.1; letter-spacing: -0.02em; margin: 0.75rem 0; }
.article-meta { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; color: var(--muted); font-family: var(--font-mono); font-size: 0.8rem; }
.article-body { font-size: 1.04rem; }
.article-body h1, .article-body h2, .article-body h3 { font-family: var(--font-display); letter-spacing: -0.01em; margin-top: 2.2em; }
.article-body h2 { font-size: 1.65rem; }
.article-body a { text-decoration: underline; text-underline-offset: 3px; }
.article-body img { max-width: 100%; border-radius: var(--radius); border: 1px solid var(--border); }
.article-body code { font-family: var(--font-mono); font-size: 0.88em; background: rgba(148, 163, 184, 0.14); padding: 0.15em 0.4em; border-radius: 6px; }
.article-body pre {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.1rem;
  overflow-x: auto;
}
.article-body pre code { background: none; padding: 0; }
.article-body blockquote {
  margin: 1.5rem 0;
  padding: 0.2rem 1.2rem;
  border-left: 3px solid var(--accent-2);
  color: var(--muted);
  font-style: italic;
}
.article-body table { border-collapse: collapse; width: 100%; margin-block: 1.5rem; font-size: 0.92rem; }
.article-body th, .article-body td { border: 1px solid var(--border); padding: 0.5rem 0.75rem; text-align: left; }
.article-body th { background: var(--surface); font-family: var(--font-mono); font-size: 0.8rem; }

/* ============ 404 ============ */
.not-found { min-height: 60svh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.25rem; text-align: center; padding-block: 4rem; }
.not-found-code {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(5rem, 18vw, 11rem);
  line-height: 1;
  color: transparent;
  -webkit-text-stroke: 2px var(--text);
  margin: 0;
}
.not-found-title { font-family: var(--font-display); font-size: 1.6rem; margin: 0; }
.not-found-desc { color: var(--muted); max-width: 44ch; margin: 0; }

/* ============ Footer ============ */
.site-footer {
  border-top: 1px solid var(--border);
  padding: 2.25rem clamp(1.25rem, 4vw, 2.5rem);
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
}
.footer-note { color: var(--muted); font-size: 0.85rem; margin: 0; }
.footer-social { display: flex; gap: 1.25rem; }
.social-link { font-family: var(--font-mono); font-size: 0.78rem; color: var(--muted); }
.social-link:hover { color: var(--accent-1); }

/* ============ Responsive ============ */
@media (max-width: 720px) {
  .site-nav { gap: 1.1rem; }
  .section { padding-block: 3rem; }
  .grid--projects, .grid--posts { grid-template-columns: 1fr; }
  .site-footer { flex-direction: column; align-items: flex-start; }
}

/* ============ Reduced motion ============ */
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .aurora, .marquee-track, .status-dot { animation: none !important; }
  .card, .btn, .card-thumb { transition: none; }
}
```

- [ ] **Step 7: Write `public/favicon.svg` and `public/robots.txt`**

`public/favicon.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#67e8f9"/>
      <stop offset="1" stop-color="#a78bfa"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="#0c1320"/>
  <text x="32" y="44" font-family="monospace" font-size="34" font-weight="700" fill="url(#g)" text-anchor="middle">c</text>
</svg>
```

`public/robots.txt`:
```
User-agent: *
Allow: /
```

- [ ] **Step 8: Run tests + typecheck**

Run: `npx vitest run test/dates.test.ts test/layout.test.ts && npm run typecheck`
Expected: PASS (4 dates + 2 layout tests); `tsc` exits 0.

- [ ] **Step 9: Commit**

```bash
git add src/views/layout.tsx src/lib/dates.ts src/lib/test-render.tsx public/styles.css public/favicon.svg public/robots.txt test/dates.test.ts test/layout.test.ts
git commit -m "feat: layout shell with layered backdrop and full stylesheet"
```

---

### Task 6: Homepage route + view

**Files:**
- Create: `src/views/home.tsx`, `src/components/cards.tsx`, `src/routes/home.ts`, `test/fixtures.ts`, `test/home.test.ts`

**Interfaces:**
- Produces: `homeRoutes(data: DataClient, baseUrl: string): Hono` — `GET /` renders `HomeView`.
- Produces: `<ProjectCard project baseUrl>` and `<PostCard post>` components (reused by Tasks 7 & 9).
- Consumes: `DataClient` (Task 3), `Layout` (Task 5), schemas (Task 2).

- [ ] **Step 1: Write `test/fixtures.ts` (shared mock data + fake client)**

```ts
import type { DataClient } from '../src/data/client'
import type { Homepage, Profile, Project, BlogPostSummary, BlogPost, Social } from '../src/data/schemas'

export const homepageFixture: Homepage = {
  hero: {
    title: "It's me, Jovylle",
    tagline: 'A Full-Stack Web Developer',
    description: 'Building modern web experiences with clean code and thoughtful design',
    githubHandle: 'jovylle',
  },
  ctas: [],
}

export const profileFixture: Profile = {
  title: 'Full-Stack Web Developer',
  short_bio: 'Builds modern, performant web experiences and developer tools.',
  availability: 'Open to opportunities',
}

export const projectsFixture: Project[] = [
  {
    title: 'SFL Digging Assistant',
    description: 'A fast, free, and visual tool for Sunflower Land players.',
    slug: 'sfl-crab',
    fav: true,
    priority_score: 600,
    tech: ['Vue', 'Nuxt'],
    thumbnail: 'https://content.jovylle.com/images/post/sfl-crab.png',
    links: [{ label: 'Repo', url: 'https://github.com/jovylle/sfl-crab' }, { label: 'Live', url: 'https://d1g.uk/' }],
  },
  {
    title: 'Chat Assistant Box',
    description: 'A fast, modern AI chat interface with markdown support.',
    slug: 'chat',
    fav: false,
    priority_score: 340,
    tech: ['JS', 'Node', 'AI'],
    thumbnail: 'https://content.jovylle.com/images/post/chat.png',
    links: [],
  },
  {
    title: 'LoopGallery',
    description: 'Social gallery for loops and creative shares.',
    slug: 'loop-gallery-space',
    fav: false,
    priority_score: 430,
    tech: ['Nuxt 3', 'D1'],
    thumbnail: 'https://content.jovylle.com/images/loop-gallery-space.png',
    links: [],
  },
]

export const blogIndexFixture: BlogPostSummary[] = [
  { slug: 'project-factory-500-autonomous-ai-apps', title: 'Project Factory: 500 Apps Built by Underpaid AI', date: '2026-07-17', excerpt: '500 small web apps built entirely by AI.', tags: ['ai', 'pipeline'], featured: true },
  { slug: 'why-i-used-cursor-ide-for-a-year', title: 'Why I Used Cursor IDE for a Year', date: '2026-07-07', excerpt: "It's the only editor that felt like everything I needed was already there.", tags: ['cursor', 'tools'], featured: false },
  { slug: 'blog-post', title: 'blog-post', date: '', excerpt: '', tags: [], featured: false },
]

export const postFixture: BlogPost = {
  slug: 'project-factory-500-autonomous-ai-apps',
  title: 'Project Factory: 500 Apps Built by Underpaid AI',
  date: '2026-07-17',
  excerpt: '500 small web apps built entirely by AI.',
  author: 'Jovylle Bermudez',
  tags: ['ai', 'pipeline'],
  featured: true,
  thumbnail: 'https://content.jovylle.com/images/post/factory-hero.png',
  content: '# Project Factory\n\nSome **bold** content.',
}

export const socialFixture: Social = {
  links: [
    { label: 'Email', url: 'mailto:me@jovylle.com', icon: 'email' },
    { label: 'GitHub', url: 'https://github.com/jovylle', icon: 'github' },
    { label: 'LinkedIn', url: 'https://linkedin.com/in/jovylle', icon: 'linkedin' },
  ],
}

export interface MockClientOptions {
  projects?: Project[]
  posts?: BlogPostSummary[]
  post?: BlogPost | undefined
  failProjects?: boolean
}

export function createMockClient(opts: MockClientOptions = {}): DataClient {
  const { projects = projectsFixture, posts = blogIndexFixture, post = postFixture, failProjects = false } = opts
  return {
    getHomepage: async () => homepageFixture,
    getProfile: async () => profileFixture,
    getProjects: async () => {
      if (failProjects) throw new Error('vault down')
      return projects
    },
    getBlogIndex: async () => ({ posts }),
    getPost: async (slug) => (post && post.slug === slug ? post : undefined),
    getSocial: async () => socialFixture,
  }
}
```

- [ ] **Step 2: Write the failing test `test/home.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { homeRoutes } from '../src/routes/home'
import { createMockClient } from './fixtures'

const app = homeRoutes(createMockClient(), 'https://content.jovylle.com')

describe('GET /', () => {
  it('returns 200 with the hero', async () => {
    const res = await app.request('/')
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(res.headers.get('content-type')).toContain('text/html')
    expect(html).toContain("It's me, Jovylle")
    expect(html).toContain('Open to opportunities')
  })

  it('shows featured projects sorted by priority', async () => {
    const html = await (await app.request('/')).text()
    expect(html).toContain('SFL Digging Assistant')
    expect(html).toContain('LoopGallery')
    expect(html).toContain('https://content.jovylle.com/images/post/sfl-crab.png')
  })

  it('shows the three latest posts (empty dates last)', async () => {
    const html = await (await app.request('/')).text()
    const factoryIdx = html.indexOf('Project Factory')
    const cursorIdx = html.indexOf('Why I Used Cursor')
    const blogPostIdx = html.indexOf('>blog-post<')
    expect(factoryIdx).toBeGreaterThan(-1)
    expect(factoryIdx).toBeLessThan(cursorIdx)
    expect(cursorIdx).toBeLessThan(blogPostIdx)
  })

  it('renders curated hero CTAs and social links', async () => {
    const html = await (await app.request('/')).text()
    expect(html).toContain('href="/projects"')
    expect(html).toContain('href="/blog"')
    expect(html).toContain('href="https://github.com/jovylle"')
    expect(html).toContain('linkedin.com/in/jovylle')
  })

  it('still renders the shell when the vault is down (graceful)', async () => {
    const down = homeRoutes(createMockClient({ failProjects: true }), 'https://content.jovylle.com')
    const res = await down.request('/')
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('Skip to content')
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run test/home.test.ts`
Expected: FAIL — `Cannot find module '../src/routes/home'`.

- [ ] **Step 4: Write `src/components/cards.tsx`**

```tsx
import type { Project, BlogPostSummary } from '../data/schemas'
import { absoluteUrl } from '../data/client'
import { formatDate } from '../lib/dates'

interface ProjectCardProps {
  project: Project
  baseUrl: string
}

export function ProjectCard({ project, baseUrl }: ProjectCardProps) {
  const thumb = project.thumbnail ? absoluteUrl(project.thumbnail, baseUrl) : ''
  return (
    <a class="card project-card" href={`/projects/${project.slug}`} data-project-card data-slug={project.slug}>
      {thumb ? (
        <div class="card-thumb-wrap">
          <img class="card-thumb" src={thumb} alt={project.title} loading="lazy" />
        </div>
      ) : (
        <div class="card-thumb--empty" aria-hidden="true">
          <span>{project.language || 'craft'}</span>
        </div>
      )}
      <div class="card-body">
        <h3 class="card-title">{project.title}</h3>
        <p class="card-desc">{project.description}</p>
        <div class="chip-row">
          {project.tech.slice(0, 4).map((t) => (
            <span class="chip" key={t}>{t}</span>
          ))}
        </div>
      </div>
    </a>
  )
}

interface PostCardProps {
  post: BlogPostSummary
}

export function PostCard({ post }: PostCardProps) {
  return (
    <a class="card post-card" href={`/blog/${post.slug}`}>
      <div class="post-meta">
        {post.featured && <span class="tag--featured">featured</span>}
        <time class="post-date" datetime={post.date}>{formatDate(post.date)}</time>
      </div>
      <div class="card-body">
        <h3 class="card-title">{post.title}</h3>
        {post.excerpt && <p class="card-desc">{post.excerpt}</p>}
        <div class="chip-row">
          {post.tags.slice(0, 4).map((t) => (
            <span class="chip" key={t}>{t}</span>
          ))}
        </div>
      </div>
    </a>
  )
}
```

- [ ] **Step 5: Write `src/views/home.tsx`**

```tsx
import type { Homepage, Profile, Project, BlogPostSummary, Social } from '../data/schemas'
import { Layout } from './layout'
import { ProjectCard, PostCard } from '../components/cards'

interface HomeViewProps {
  homepage: Homepage
  profile: Profile
  featuredProjects: Project[]
  recentPosts: BlogPostSummary[]
  social: Social
  baseUrl: string
  path: string
}

const HERO_CTAS = [
  { href: '/projects', label: 'View projects', variant: 'primary' },
  { href: '/blog', label: 'Read the blog', variant: 'ghost' },
  { href: 'https://github.com/jovylle', label: 'GitHub', variant: 'ghost', external: true },
]

export function HomeView({ homepage, profile, featuredProjects, recentPosts, social, baseUrl, path }: HomeViewProps) {
  const { hero } = homepage
  const words = hero.title.split(' ')

  const marqueeItems = [
    ...featuredProjects.flatMap((p) => p.tech),
    'TypeScript', 'Hono', 'Cloudflare Workers', 'Vue', 'Nuxt', 'FastAPI', 'Go',
  ].slice(0, 14)
  const marqueeRow = [...marqueeItems, ...marqueeItems] // duplicated for seamless loop

  return (
    <Layout title="Home" description={hero.description} path={path} socialLinks={social.links}>
      <section class="hero wrap">
        {profile.availability && (
          <p class="hero-kicker">
            <span class="status-dot" aria-hidden="true" />
            {profile.availability}
          </p>
        )}
        <h1 class="hero-title">
          {words.map((word, i) => (
            <span class={i % 2 === 0 ? 'outline' : 'accent'} key={`${word}-${i}`}>
              {word}{' '}
            </span>
          ))}
        </h1>
        {hero.tagline && <p class="hero-tagline">{hero.tagline}</p>}
        {hero.description && <p class="hero-desc">{hero.description}</p>}
        <div class="hero-ctas">
          {HERO_CTAS.map((cta) => (
            <a
              class={cta.variant === 'primary' ? 'btn btn--primary' : 'btn btn--ghost'}
              href={cta.href}
              key={cta.href}
              {...(cta.external ? { rel: 'noopener noreferrer', target: '_blank' } : {})}
            >
              {cta.label}
            </a>
          ))}
        </div>
      </section>

      <div class="marquee" aria-hidden="true">
        <div class="marquee-track">
          {marqueeRow.map((item, i) => (
            <span key={`${item}-${i}`}>{item}</span>
          ))}
        </div>
      </div>

      <section class="section wrap">
        <div class="section-head">
          <span class="section-index">01</span>
          <h2 class="section-title">Featured work</h2>
          <a class="section-link" href="/projects">all projects →</a>
        </div>
        <div class="grid grid--projects">
          {featuredProjects.map((project) => (
            <ProjectCard project={project} baseUrl={baseUrl} key={project.slug} />
          ))}
        </div>
      </section>

      <section class="section wrap">
        <div class="section-head">
          <span class="section-index">02</span>
          <h2 class="section-title">Latest writing</h2>
          <a class="section-link" href="/blog">all posts →</a>
        </div>
        <div class="grid grid--posts">
          {recentPosts.map((post) => (
            <PostCard post={post} key={post.slug} />
          ))}
        </div>
      </section>
    </Layout>
  )
}
```

- [ ] **Step 6: Write `src/routes/home.ts`**

```ts
import { Hono } from 'hono'
import type { DataClient } from '../data/client'
import { HomeView } from '../views/home'

export function homeRoutes(data: DataClient, baseUrl: string): Hono {
  const app = new Hono()

  app.get('/', async (c) => {
    const [homepage, profile, projects, blogIndex, social] = await Promise.all([
      data.getHomepage(),
      data.getProfile(),
      data.getProjects().catch(() => []), // graceful: homepage renders with an empty grid when the vault is down
      data.getBlogIndex(),
      data.getSocial(),
    ])

    const sorted = [...projects].sort((a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0))
    const withThumbs = sorted.filter((p) => p.thumbnail)
    const featured = (withThumbs.length >= 3 ? withThumbs : sorted).slice(0, 6)

    const recent = [...blogIndex.posts]
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .slice(0, 3)

    return c.html(
      <HomeView
        homepage={homepage}
        profile={profile}
        featuredProjects={featured}
        recentPosts={recent}
        social={social}
        baseUrl={baseUrl}
        path="/"
      />,
    )
  })

  return app
}
```

- [ ] **Step 7: Run tests + typecheck**

Run: `npx vitest run test/home.test.ts && npm run typecheck`
Expected: PASS (5 home tests); `tsc` exits 0.

- [ ] **Step 8: Commit**

```bash
git add src/views/home.tsx src/components/cards.tsx src/routes/home.ts test/fixtures.ts test/home.test.ts
git commit -m "feat: homepage with hero, featured projects, latest posts and marquee"
```

---

### Task 7: Projects list + client-side filter

**Files:**
- Create: `src/client/project-filter.ts`, `src/views/projects.tsx`, `src/routes/projects.ts`, `public/app.js`
- Test: `test/project-filter.test.ts`, `test/projects.test.ts`

**Interfaces:**
- Produces: `applyFilter(projects: Project[], state: { query: string; tag: string }): Project[]` and `collectTags(projects: Project[], limit?: number): string[]` (pure functions).
- Produces: `projectsRoutes(data: DataClient, baseUrl: string): Hono` — `GET /projects`.
- Consumes: `ProjectCard` (Task 6), `Layout` (Task 5).

- [ ] **Step 1: Write the failing tests**

`test/project-filter.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { applyFilter, collectTags } from '../src/client/project-filter'
import { projectsFixture } from './fixtures'

describe('applyFilter', () => {
  it('returns everything with an empty state', () => {
    expect(applyFilter(projectsFixture, { query: '', tag: '' })).toHaveLength(3)
  })

  it('filters by tag', () => {
    const result = applyFilter(projectsFixture, { query: '', tag: 'Vue' })
    expect(result.map((p) => p.slug)).toEqual(['sfl-crab'])
  })

  it('filters by query across title, description and tech', () => {
    expect(applyFilter(projectsFixture, { query: 'chat', tag: '' }).map((p) => p.slug)).toEqual(['chat'])
    expect(applyFilter(projectsFixture, { query: 'gallery', tag: '' }).map((p) => p.slug)).toEqual(['loop-gallery-space'])
  })

  it('combines query and tag', () => {
    const result = applyFilter(projectsFixture, { query: 'assistant', tag: 'Vue' })
    expect(result.map((p) => p.slug)).toEqual(['sfl-crab'])
    expect(applyFilter(projectsFixture, { query: 'assistant', tag: 'D1' })).toHaveLength(0)
  })

  it('is case-insensitive', () => {
    expect(applyFilter(projectsFixture, { query: 'SFL', tag: '' })).toHaveLength(1)
  })
})

describe('collectTags', () => {
  it('collects unique tags ordered by frequency', () => {
    const tags = collectTags(projectsFixture)
    expect(tags[0]).toBe('Vue') // appears once, ties broken by insertion order — assert membership only
    expect(tags).toContain('Vue')
    expect(tags).toContain('AI')
    expect(tags.length).toBeGreaterThanOrEqual(6)
  })

  it('respects the limit', () => {
    expect(collectTags(projectsFixture, 2).length).toBeLessThanOrEqual(2)
  })
})
```

`test/projects.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { projectsRoutes } from '../src/routes/projects'
import { createMockClient } from './fixtures'

const app = projectsRoutes(createMockClient(), 'https://content.jovylle.com')

describe('GET /projects', () => {
  it('returns 200 with all project cards sorted by priority', async () => {
    const res = await app.request('/')
    expect(res.status).toBe(200)
    const html = await res.text()
    const sflIdx = html.indexOf('SFL Digging Assistant')
    const loopIdx = html.indexOf('LoopGallery')
    const chatIdx = html.indexOf('Chat Assistant Box')
    expect(sflIdx).toBeGreaterThan(-1)
    expect(sflIdx).toBeLessThan(loopIdx) // 600 before 430
    expect(loopIdx).toBeLessThan(chatIdx) // 430 before 340
  })

  it('renders the search box and data attributes for the filter script', async () => {
    const html = await (await app.request('/')).text()
    expect(html).toContain('data-search')
    expect(html).toContain('data-project-grid')
    expect(html).toContain('data-tags="Vue,Nuxt"')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run test/project-filter.test.ts test/projects.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write `src/client/project-filter.ts`**

```ts
import type { Project } from '../data/schemas'

export interface FilterState {
  query: string
  tag: string
}

export function applyFilter(projects: Project[], state: FilterState): Project[] {
  const q = state.query.trim().toLowerCase()
  return projects.filter((p) => {
    if (state.tag && !(p.tech ?? []).includes(state.tag)) return false
    if (!q) return true
    const haystack = [p.title, p.description, p.language, ...(p.tech ?? [])].join(' ').toLowerCase()
    return haystack.includes(q)
  })
}

export function collectTags(projects: Project[], limit = 24): string[] {
  const counts = new Map<string, number>()
  for (const p of projects) {
    for (const t of p.tech ?? []) counts.set(t, (counts.get(t) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag)
}
```

- [ ] **Step 4: Write `src/views/projects.tsx`**

```tsx
import type { Project } from '../data/schemas'
import { Layout } from './layout'
import { ProjectCard } from '../components/cards'
import { collectTags } from '../client/project-filter'

interface ProjectsViewProps {
  projects: Project[]
  tags: string[]
  socialLinks: SocialLink[]
  baseUrl: string
  path: string
}

export function ProjectsView({ projects, tags, socialLinks, baseUrl, path }: ProjectsViewProps) {
  return (
    <Layout title="Projects" description="Everything Jovylle has built" path={path} socialLinks={socialLinks}>
      <section class="wrap" style={{ paddingTop: '3.5rem' }}>
        <div class="section-head">
          <span class="section-index">//</span>
          <h1 class="section-title">Projects</h1>
        </div>
        <p class="page-intro">
          A living archive of things built — sorted by what matters most. Filter by keyword or tech.
        </p>

        <div class="toolbar">
          <input
            class="search-box"
            type="search"
            placeholder="Search projects…"
            aria-label="Search projects"
            data-search
          />
          <div class="tag-bar" data-tags>
            {tags.map((tag) => (
              <button type="button" class="tag-btn" data-tag={tag} key={tag}>
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div class="grid grid--projects" data-project-grid>
          {projects.map((project) => {
            const searchable = [project.title, project.description, project.language, ...(project.tech ?? [])].join(' ').replace(/"/g, '')
            const tagList = (project.tech ?? []).join(',')
            return (
              <div data-project-card data-search={searchable} data-tags={tagList} key={project.slug}>
                <ProjectCard project={project} baseUrl={baseUrl} />
              </div>
            )
          })}
        </div>
        <p class="empty-state" data-empty hidden>
          No projects match that filter.
        </p>
      </section>
    </Layout>
  )
}
```

> `SocialLink` import: `import type { SocialLink } from '../data/schemas'` — add to the imports.

- [ ] **Step 5: Write `src/routes/projects.ts`**

```ts
import { Hono } from 'hono'
import type { DataClient } from '../data/client'
import { ProjectsView } from '../views/projects'
import { collectTags } from '../client/project-filter'

export function projectsRoutes(data: DataClient, baseUrl: string): Hono {
  const app = new Hono()

  app.get('/projects', async (c) => {
    const [projects, social] = await Promise.all([data.getProjects(), data.getSocial()])
    const sorted = [...projects].sort((a, b) => (b.priority_score ?? 0) - (a.priority_score ?? 0))
    return c.html(
      <ProjectsView
        projects={sorted}
        tags={collectTags(sorted)}
        socialLinks={social.links}
        baseUrl={baseUrl}
        path="/projects"
      />,
    )
  })

  return app
}
```

- [ ] **Step 6: Write `public/app.js` (vanilla filter glue — mirrors `applyFilter` semantics)**

```js
/* Craft — projects filter. Mirrors src/client/project-filter.ts semantics. */
(function () {
  const grid = document.querySelector('[data-project-grid]')
  const input = document.querySelector('[data-search]')
  const tagBar = document.querySelector('[data-tags]')
  const empty = document.querySelector('[data-empty]')
  if (!grid || !input) return

  const cards = Array.from(grid.querySelectorAll('[data-project-card]'))

  function matches(card) {
    const activeTag = tagBar ? tagBar.dataset.active || '' : ''
    const query = (input.value || '').trim().toLowerCase()
    const tags = (card.dataset.tags || '').split(',')
    if (activeTag && !tags.includes(activeTag)) return false
    if (!query) return true
    return (card.dataset.search || '').toLowerCase().includes(query)
  }

  function render() {
    let visible = 0
    for (const card of cards) {
      const show = matches(card)
      card.hidden = !show
      if (show) visible++
    }
    if (empty) empty.hidden = visible !== 0
  }

  input.addEventListener('input', render)

  if (tagBar) {
    tagBar.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-tag]')
      if (!btn) return
      const tag = btn.dataset.tag
      const next = tagBar.dataset.active === tag ? '' : tag
      tagBar.dataset.active = next
      for (const b of tagBar.querySelectorAll('[data-tag]')) {
        b.classList.toggle('active', b.dataset.tag === next)
      }
      render()
    })
  }

  render()
})()
```

- [ ] **Step 7: Run tests + typecheck**

Run: `npx vitest run test/project-filter.test.ts test/projects.test.ts && npm run typecheck`
Expected: PASS (5 filter + 2 projects tests); `tsc` exits 0.

- [ ] **Step 8: Manual verification of the filter script**

Run: `npm run dev` then open `http://localhost:8787/projects` — type in the search box (e.g. "chat") and click a tag button; the grid filters and the empty state appears when nothing matches.

- [ ] **Step 9: Commit**

```bash
git add src/client/project-filter.ts src/views/projects.tsx src/routes/projects.ts public/app.js test/project-filter.test.ts test/projects.test.ts
git commit -m "feat: projects page with search and tag filtering"
```

---

### Task 8: Project detail page

**Files:**
- Create: `src/views/project-detail.tsx`, `src/views/not-found.tsx`, `src/routes/project-detail.ts`
- Test: `test/project-detail.test.ts`

**Interfaces:**
- Produces: `projectDetailRoutes(data: DataClient, baseUrl: string): Hono` — `GET /projects/:slug` (404 → `NotFoundView`).
- Produces: `<NotFoundView path message?>` — shared by Tasks 10 & 11.

- [ ] **Step 1: Write the failing test `test/project-detail.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { projectDetailRoutes } from '../src/routes/project-detail'
import { createMockClient } from './fixtures'

const app = projectDetailRoutes(createMockClient(), 'https://content.jovylle.com')

describe('GET /projects/:slug', () => {
  it('renders the project detail', async () => {
    const res = await app.request('/projects/sfl-crab')
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('SFL Digging Assistant')
    expect(html).toContain('A fast, free, and visual tool')
    expect(html).toContain('https://github.com/jovylle/sfl-crab')
    expect(html).toContain('https://d1g.uk/')
    expect(html).toContain('Vue')
    expect(html).toContain('https://content.jovylle.com/images/post/sfl-crab.png')
  })

  it('renders a styled 404 for an unknown slug', async () => {
    const res = await app.request('/projects/does-not-exist')
    expect(res.status).toBe(404)
    const html = await res.text()
    expect(html).toContain('404')
    expect(html).toContain('Page not found')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/project-detail.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write `src/views/not-found.tsx`**

```tsx
import { Layout } from './layout'

interface NotFoundViewProps {
  path: string
  message?: string
}

export function NotFoundView({ path, message = 'The page you are looking for does not exist.' }: NotFoundViewProps) {
  return (
    <Layout title="Not found" description="404" path={path} socialLinks={[]}>
      <section class="not-found wrap">
        <h1 class="not-found-code">404</h1>
        <h2 class="not-found-title">Page not found</h2>
        <p class="not-found-desc">{message}</p>
        <a class="btn btn--primary" href="/">
          Back to home
        </a>
      </section>
    </Layout>
  )
}
```

- [ ] **Step 4: Write `src/views/project-detail.tsx`**

```tsx
import type { Project, SocialLink } from '../data/schemas'
import { absoluteUrl } from '../data/client'
import { formatDate } from '../lib/dates'
import { Layout } from './layout'

interface ProjectDetailViewProps {
  project: Project
  socialLinks: SocialLink[]
  baseUrl: string
  path: string
}

export function ProjectDetailView({ project, socialLinks, baseUrl, path }: ProjectDetailViewProps) {
  const thumb = project.thumbnail ? absoluteUrl(project.thumbnail, baseUrl) : ''

  return (
    <Layout title={project.title} description={project.description} path={path} socialLinks={socialLinks}>
      <article class="wrap">
        <div class="detail-hero">
          <a class="back-link" href="/projects">← all projects</a>
          <h1 class="detail-title">{project.title}</h1>
          {project.description && <p class="detail-desc">{project.description}</p>}

          {(project.links.length > 0 || project.repo) && (
            <div class="link-row">
              {project.links.map((link) => (
                <a class="btn btn--ghost" href={link.url} rel="noopener noreferrer" key={link.label}>
                  {link.label}
                </a>
              ))}
              {project.repo && (
                <a class="btn btn--ghost" href={project.repo} rel="noopener noreferrer">
                  Repo
                </a>
              )}
            </div>
          )}

          <div class="detail-meta">
            {(project.created_at || project.updated_at) && (
              <div class="meta-item">
                <span class="meta-label">updated</span>
                <span class="meta-value">{formatDate(project.updated_at || project.created_at || '')}</span>
              </div>
            )}
            {project.language && (
              <div class="meta-item">
                <span class="meta-label">stack</span>
                <span class="meta-value">{project.language}</span>
              </div>
            )}
            {project.fav && (
              <div class="meta-item">
                <span class="meta-label">status</span>
                <span class="meta-value">★ favorite</span>
              </div>
            )}
          </div>

          <div class="chip-row">
            {project.tech.map((t) => (
              <span class="chip" key={t}>{t}</span>
            ))}
          </div>
        </div>

        {thumb && <img class="detail-thumb" src={thumb} alt={project.title} />}
      </article>
    </Layout>
  )
}
```

- [ ] **Step 5: Write `src/routes/project-detail.ts`**

```ts
import { Hono } from 'hono'
import type { DataClient } from '../data/client'
import { ProjectDetailView } from '../views/project-detail'
import { NotFoundView } from '../views/not-found'

export function projectDetailRoutes(data: DataClient, baseUrl: string): Hono {
  const app = new Hono()

  app.get('/projects/:slug', async (c) => {
    const slug = c.req.param('slug')
    const [project, social] = await Promise.all([data.getProject(slug), data.getSocial()])
    if (!project) return c.html(<NotFoundView path={c.req.path} />, 404)
    return c.html(
      <ProjectDetailView project={project} socialLinks={social.links} baseUrl={baseUrl} path={c.req.path} />,
    )
  })

  return app
}
```

> Note: this needs `getProject(slug)` on the client. Add to `src/data/client.ts` (interface + implementation, one-liner delegating to `getProjects` + find):

```ts
// interface addition
getProject(slug: string): Promise<Project | undefined>

// implementation addition
async getProject(slug) {
  const projects = await this.getProjects()
  return projects.find((p) => p.slug === slug)
}
```

- [ ] **Step 6: Run tests + typecheck**

Run: `npx vitest run test/project-detail.test.ts && npm run typecheck`
Expected: PASS (2 detail tests); `tsc` exits 0. If `fixtures.ts` mock lacks `getProject`, add it: `getProject: async (slug) => projects.find((p) => p.slug === slug)`.

- [ ] **Step 7: Commit**

```bash
git add src/views/project-detail.tsx src/views/not-found.tsx src/routes/project-detail.ts src/data/client.ts test/project-detail.test.ts test/fixtures.ts
git commit -m "feat: project detail page with 404 handling"
```

---

### Task 9: Blog list page

**Files:**
- Create: `src/views/blog.tsx`, `src/routes/blog.ts`
- Test: `test/blog.test.ts`

**Interfaces:**
- Produces: `blogRoutes(data: DataClient, baseUrl: string): Hono` — `GET /blog` (featured first, then by date desc, empty dates last).
- Consumes: `PostCard` (Task 6), `Layout` (Task 5).

- [ ] **Step 1: Write the failing test `test/blog.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { blogRoutes } from '../src/routes/blog'
import { createMockClient } from './fixtures'

const app = blogRoutes(createMockClient(), 'https://content.jovylle.com')

describe('GET /blog', () => {
  it('returns 200 with posts', async () => {
    const res = await app.request('/blog')
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('Project Factory: 500 Apps Built by Underpaid AI')
    expect(html).toContain('featured')
    expect(html).toContain('Jul 17, 2026')
  })

  it('orders featured first, then by date desc with empty dates last', async () => {
    const html = await (await app.request('/blog')).text()
    const featuredIdx = html.indexOf('Project Factory')
    const cursorIdx = html.indexOf('Why I Used Cursor')
    const emptyIdx = html.indexOf('>blog-post<')
    expect(featuredIdx).toBeGreaterThan(-1)
    expect(featuredIdx).toBeLessThan(cursorIdx)
    expect(cursorIdx).toBeLessThan(emptyIdx)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/blog.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write `src/views/blog.tsx`**

```tsx
import type { BlogPostSummary, SocialLink } from '../data/schemas'
import { Layout } from './layout'
import { PostCard } from '../components/cards'

interface BlogViewProps {
  posts: BlogPostSummary[]
  socialLinks: SocialLink[]
  path: string
}

export function BlogView({ posts, socialLinks, path }: BlogViewProps) {
  return (
    <Layout title="Blog" description="Writing about building, AI, and side projects" path={path} socialLinks={socialLinks}>
      <section class="wrap" style={{ paddingTop: '3.5rem' }}>
        <div class="section-head">
          <span class="section-index">//</span>
          <h1 class="section-title">Blog</h1>
        </div>
        <p class="page-intro">Notes on building things, AI workflows, and whatever else sticks.</p>
        <div class="grid grid--posts">
          {posts.map((post) => (
            <PostCard post={post} key={post.slug} />
          ))}
        </div>
      </section>
    </Layout>
  )
}
```

- [ ] **Step 4: Write `src/routes/blog.ts`**

```ts
import { Hono } from 'hono'
import type { DataClient } from '../data/client'
import { BlogView } from '../views/blog'

export function blogRoutes(data: DataClient, baseUrl: string): Hono {
  const app = new Hono()

  app.get('/blog', async (c) => {
    const [blogIndex, social] = await Promise.all([data.getBlogIndex(), data.getSocial()])
    const posts = [...blogIndex.posts]
      .filter((p) => p.title && p.slug && p.title !== 'blog-post')
      .sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1
        return (b.date || '').localeCompare(a.date || '')
      })
    return c.html(<BlogView posts={posts} socialLinks={social.links} path="/blog" />)
  })

  return app
}
```

> The `filter((p) => ...)` drops draft/empty scaffold posts (e.g. `blog-post`, `blog-post123`) from the list. Keep the same filter on the homepage in Task 6 — update `homeRoutes` `recent` to reuse it (extract to `src/data/sort.ts`: `sortPosts(posts: BlogPostSummary[]): BlogPostSummary[]` and `isRealPost(p)`, used by both).

- [ ] **Step 5: Write `src/data/sort.ts` + update Task 6 home route to use it**

```ts
import type { BlogPostSummary } from './schemas'

export function isRealPost(p: BlogPostSummary): boolean {
  return Boolean(p.title && p.slug && p.title !== 'blog-post')
}

export function sortPosts(posts: BlogPostSummary[]): BlogPostSummary[] {
  return [...posts]
    .filter(isRealPost)
    .sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1
      return (b.date || '').localeCompare(a.date || '')
    })
}
```

Update `src/routes/home.ts`: replace the `recent` computation with `sortPosts(blogIndex.posts).slice(0, 3)` and remove the old inline sort.

Update `test/home.test.ts` — the third test changes because `sortPosts` now filters scaffold posts (e.g. `blog-post`):

```ts
  it('shows the latest real posts (scaffold posts excluded)', async () => {
    const html = await (await app.request('/')).text()
    const factoryIdx = html.indexOf('Project Factory')
    const cursorIdx = html.indexOf('Why I Used Cursor')
    expect(factoryIdx).toBeGreaterThan(-1)
    expect(factoryIdx).toBeLessThan(cursorIdx)
    expect(html).not.toContain('>blog-post<')
  })
```

Update `test/blog.test.ts` — drop the empty-title ordering assertion:

```ts
  it('orders featured first, then by date desc', async () => {
    const html = await (await app.request('/blog')).text()
    const featuredIdx = html.indexOf('Project Factory')
    const cursorIdx = html.indexOf('Why I Used Cursor')
    expect(featuredIdx).toBeGreaterThan(-1)
    expect(featuredIdx).toBeLessThan(cursorIdx)
    expect(html).not.toContain('>blog-post<')
  })
```

- [ ] **Step 6: Run tests + typecheck**

Run: `npx vitest run test/blog.test.ts test/home.test.ts && npm run typecheck`
Expected: PASS (2 blog + 5 home tests); `tsc` exits 0.

- [ ] **Step 7: Commit**

```bash
git add src/views/blog.tsx src/routes/blog.ts src/data/sort.ts src/routes/home.ts test/blog.test.ts
git commit -m "feat: blog list page with featured-first ordering"
```

---

### Task 10: Blog post detail page

**Files:**
- Create: `src/views/post.tsx`, `src/routes/post.ts`
- Test: `test/post.test.ts`

**Interfaces:**
- Produces: `postRoutes(data: DataClient, baseUrl: string): Hono` — `GET /blog/:slug` renders markdown; 404 → `NotFoundView`.
- Consumes: `renderMarkdown` (Task 4), `NotFoundView` (Task 8), `formatDate` (Task 5).

- [ ] **Step 1: Write the failing test `test/post.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { postRoutes } from '../src/routes/post'
import { createMockClient } from './fixtures'

const app = postRoutes(createMockClient(), 'https://content.jovylle.com')

describe('GET /blog/:slug', () => {
  it('renders the post with markdown body', async () => {
    const res = await app.request('/blog/project-factory-500-autonomous-ai-apps')
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('Project Factory: 500 Apps Built by Underpaid AI')
    expect(html).toContain('Jovylle Bermudez')
    expect(html).toContain('Jul 17, 2026')
    expect(html).toContain('<h1>Project Factory</h1>')
    expect(html).toContain('<strong>bold</strong>')
  })

  it('renders a styled 404 for an unknown post', async () => {
    const res = await app.request('/blog/nope')
    expect(res.status).toBe(404)
    expect(await res.text()).toContain('404')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/post.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write `src/views/post.tsx`**

```tsx
import type { BlogPost, SocialLink } from '../data/schemas'
import { Layout } from './layout'
import { formatDate } from '../lib/dates'

interface PostViewProps {
  post: BlogPost
  bodyHtml: string
  socialLinks: SocialLink[]
  path: string
}

export function PostView({ post, bodyHtml, socialLinks, path }: PostViewProps) {
  return (
    <Layout title={post.title} description={post.excerpt} path={path} socialLinks={socialLinks}>
      <article class="article wrap">
        <header class="article-header">
          <a class="back-link" href="/blog">← all posts</a>
          <h1 class="article-title">{post.title}</h1>
          <div class="article-meta">
            {post.author && <span>{post.author}</span>}
            {post.date && <time datetime={post.date}>{formatDate(post.date)}</time>}
            {post.featured && <span class="tag--featured">featured</span>}
          </div>
          <div class="chip-row" style={{ marginTop: '1rem' }}>
            {post.tags.map((t) => (
              <span class="chip" key={t}>{t}</span>
            ))}
          </div>
        </header>
        {/* rendered markdown is sanitized by renderMarkdown */}
        <div class="article-body" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      </article>
    </Layout>
  )
}
```

- [ ] **Step 4: Write `src/routes/post.ts`**

```ts
import { Hono } from 'hono'
import type { DataClient } from '../data/client'
import { PostView } from '../views/post'
import { NotFoundView } from '../views/not-found'
import { renderMarkdown } from '../lib/markdown'

export function postRoutes(data: DataClient, baseUrl: string): Hono {
  const app = new Hono()

  app.get('/blog/:slug', async (c) => {
    const slug = c.req.param('slug')
    const [post, social] = await Promise.all([data.getPost(slug), data.getSocial()])
    if (!post) return c.html(<NotFoundView path={c.req.path} />, 404)
    const bodyHtml = await renderMarkdown(post.content)
    return c.html(
      <PostView post={post} bodyHtml={bodyHtml} socialLinks={social.links} path={c.req.path} />,
    )
  })

  return app
}
```

- [ ] **Step 5: Run tests + typecheck**

Run: `npx vitest run test/post.test.ts && npm run typecheck`
Expected: PASS (2 post tests); `tsc` exits 0.

- [ ] **Step 6: Commit**

```bash
git add src/views/post.tsx src/routes/post.ts test/post.test.ts
git commit -m "feat: blog post page with server-rendered markdown"
```

---

### Task 11: App composition + full route suite

**Files:**
- Create: `src/app.ts`, `test/routes.test.ts`
- Modify: `src/index.ts` (use `createApp`)
- Test: `test/routes.test.ts`, `test/smoke.test.ts`

**Interfaces:**
- Produces: `createApp(deps: { data: DataClient; baseUrl?: string }): Hono` — composes all five route factories, notFound → `NotFoundView`, onError → 500 page.
- Consumes: all route factories (Tasks 6-10), `NotFoundView` (Task 8).

- [ ] **Step 1: Write the failing test `test/routes.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { createApp } from '../src/app'
import { createMockClient } from './fixtures'

const app = createApp({ data: createMockClient() })

describe('composed app', () => {
  it('homepage: GET /', async () => {
    const res = await app.request('/')
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('<!doctype html>')
    expect(html).toContain("It's me, Jovylle")
  })

  it('projects: GET /projects', async () => {
    const res = await app.request('/projects')
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('SFL Digging Assistant')
  })

  it('project detail: GET /projects/sfl-crab', async () => {
    const res = await app.request('/projects/sfl-crab')
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('d1g.uk')
  })

  it('blog: GET /blog', async () => {
    const res = await app.request('/blog')
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('Project Factory')
  })

  it('post: GET /blog/project-factory-500-autonomous-ai-apps', async () => {
    const res = await app.request('/blog/project-factory-500-autonomous-ai-apps')
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('<h1>Project Factory</h1>')
  })

  it('404 for unknown project and post slugs', async () => {
    expect((await app.request('/projects/nope')).status).toBe(404)
    expect((await app.request('/blog/nope')).status).toBe(404)
  })

  it('404 for unknown paths', async () => {
    const res = await app.request('/definitely-not-a-page')
    expect(res.status).toBe(404)
    expect(await res.text()).toContain('404')
  })

  it('500 page when the vault is down', async () => {
    const broken = createApp({ data: createMockClient({ failProjects: true }) })
    const res = await broken.request('/projects')
    expect(res.status).toBe(500)
    expect(await res.text()).toContain('Something went wrong')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run test/routes.test.ts`
Expected: FAIL — `Cannot find module '../src/app'`.

- [ ] **Step 3: Write `src/app.ts`**

```ts
import { Hono } from 'hono'
import type { DataClient } from './data/client'
import { homeRoutes } from './routes/home'
import { projectsRoutes } from './routes/projects'
import { projectDetailRoutes } from './routes/project-detail'
import { blogRoutes } from './routes/blog'
import { postRoutes } from './routes/post'
import { NotFoundView } from './views/not-found'

export interface AppDeps {
  data: DataClient
  baseUrl?: string
}

export function createApp({ data, baseUrl = 'https://content.jovylle.com' }: AppDeps): Hono {
  const app = new Hono()

  app.route('/', homeRoutes(data, baseUrl))
  app.route('/', projectsRoutes(data, baseUrl))
  app.route('/', projectDetailRoutes(data, baseUrl))
  app.route('/', blogRoutes(data, baseUrl))
  app.route('/', postRoutes(data, baseUrl))

  app.notFound((c) => c.html(<NotFoundView path={new URL(c.req.url).pathname} />, 404))

  app.onError((err, c) => {
    console.error('craft error:', err)
    return c.html(
      <NotFoundView path={new URL(c.req.url).pathname} message="Something went wrong — try again shortly." />,
      500,
    )
  })

  return app
}
```

- [ ] **Step 4: Update `src/index.ts`**

```ts
import { createApp } from './app'
import { createDataClient } from './data/client'

const app = createApp({ data: createDataClient() })

export default app
```

- [ ] **Step 5: Update `test/smoke.test.ts` (home now renders HTML)**

```ts
import { describe, it, expect } from 'vitest'
import app from '../src/index'

describe('smoke', () => {
  it('serves the homepage over the network client', async () => {
    const res = await app.request('https://example.com/')
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('<!doctype html>')
  })
})
```

> Note: `app.request('https://example.com/')` — Hono's `request` accepts a full URL; the mock data layer never hits the network (injected client), so this is hermetic.

- [ ] **Step 6: Run the full suite + typecheck**

Run: `npm test && npm run typecheck`
Expected: ALL tests pass (smoke, schemas, ttl-cache, client, sanitize, markdown, dates, layout, home, project-filter, projects, project-detail, blog, post, routes); `tsc` exits 0.

- [ ] **Step 7: Manual dev-server check**

Run: `npm run dev` — visit `/`, `/projects`, `/projects/sfl-crab`, `/blog`, `/blog/project-factory-500-autonomous-ai-apps`, and a bogus path. Confirm real vault content renders, filter works, and the 404 page shows.

- [ ] **Step 8: Commit**

```bash
git add src/app.ts src/index.ts test/routes.test.ts test/smoke.test.ts
git commit -m "feat: compose app with 404/500 handling and full route test suite"
```

---

### Task 12: Deploy to Cloudflare Workers + custom domain

**Files:**
- Modify: `wrangler.toml` (add custom-domain route)
- Test: live curl checks

- [ ] **Step 1: Typecheck + test gate**

Run: `npm run typecheck && npm test`
Expected: both pass.

- [ ] **Step 2: Deploy to the workers.dev preview**

Run: `npx wrangler deploy`
Expected: success output with URL like `https://craft.<account-subdomain>.workers.dev`.

- [ ] **Step 3: Verify the deployed worker**

Run: `curl -sI https://craft.<account-subdomain>.workers.dev/ | head -5` and `curl -s https://craft.<account-subdomain>.workers.dev/ | grep -o '<title>[^<]*</title>'`
Expected: `200` and `<title>Home — craft</title>`.

- [ ] **Step 4: Add the custom domain route**

Modify `wrangler.toml`:
```toml
routes = [
  { pattern = "craft.uft1.com", custom_domain = true }
]
```

Run: `npx wrangler deploy`
Expected: custom domain `craft.uft1.com` attaches. If wrangler errors with a zone/verification issue, add the domain via the dashboard instead: **Cloudflare dashboard → Workers & Pages → craft → Settings → Domains & Routes → Add → craft.uft1.com** (the zone is already on the account). Re-run `wrangler deploy` after.

- [ ] **Step 5: Verify live routes**

Run:
```bash
curl -sI https://craft.uft1.com/ | head -1
curl -s https://craft.uft1.com/projects | grep -c 'class="card'
curl -s https://craft.uft1.com/blog/project-factory-500-autonomous-ai-apps | grep -o '<title>[^<]*</title>'
curl -s -o /dev/null -w '%{http_code}\n' https://craft.uft1.com/does-not-exist
```
Expected: `200`, card count > 0, post title present, `404`.

- [ ] **Step 6: Commit the route config**

```bash
git add wrangler.toml
git commit -m "chore: attach craft.uft1.com custom domain"
```

---

### Task 13: GitHub repo, CI, README, registry

**Files:**
- Create: `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, `README.md`
- Modify: `/Volumes/DevSSD/fore/lab/PROJECTS.md` (add craft row)
- Test: CI run + push verification

- [ ] **Step 1: Write `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm test
```

- [ ] **Step 2: Write `.github/workflows/deploy.yml`**

```yaml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm test
      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

> Secrets: add `CLOUDFLARE_API_TOKEN` (Workers Scripts:Edit) and `CLOUDFLARE_ACCOUNT_ID` to the repo settings → Secrets and variables → Actions. If the custom-domain route from Task 12 requires dashboard approval, the deploy action still publishes the script; the route persists once approved.

- [ ] **Step 3: Write `README.md`**

```markdown
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
```

- [ ] **Step 4: Create and push the GitHub repo**

Run:
```bash
gh auth status
git add -A
git commit -m "docs: readme and CI workflows"
gh repo create jovylle/craft --public --source . --remote origin --push
```
Expected: repo created at `https://github.com/jovylle/craft`, branch pushed, CI + Deploy workflows start.

- [ ] **Step 5: Verify CI + deploy**

Run: `gh run list --limit 3`
Expected: `CI` passes; if `Deploy` ran, it passes after secrets are set. Set the two secrets if not already present (see Step 2 note).

- [ ] **Step 6: Update the lab registry `PROJECTS.md`**

Add a row to the **Live URLs** table and the **Cloudflare Workers / Pages** table (file: `/Volumes/DevSSD/fore/lab/PROJECTS.md`):

| Project | Live URL(s) | Repo path |
|---|---|---|
| **craft** | https://craft.uft1.com | `craft/` |

| Project | Deploy command | Extra |
|---|---|---|
| **craft** | `npx wrangler deploy` (in `craft/`) | Custom domain on uft1.com zone; CI deploys on push |

- [ ] **Step 7: Final verification**

Run: `curl -sI https://craft.uft1.com/ | head -1` and `npm test` in `craft/`.
Expected: `200` and a green suite.
```

---

## Self-Review

**Spec coverage check** — every spec section maps to tasks:
- Stack (Hono/TS/marked/Zod/Vitest/Wrangler/custom CSS/vanilla JS) → T1, T2, T4, T5, T7 ✓
- All six routes + styled 404 → T6-T11 ✓
- Data layer (DI fetch, Zod validation, TTL cache, stale fallback, thumbnail resolution) → T3 ✓
- Visual direction (layered backdrop, fonts, outlined headline, marquee, section indices, hover glow, reduced motion) → T5 (CSS) + T6-T10 (views) ✓
- Test suites (routes/data/markdown/app) → T3, T4, T6-T11 ✓
- Deploy + custom domain craft.uft1.com → T12 ✓
- GitHub push + CI + README + PROJECTS.md → T13 ✓
- Non-goals (no client framework, no DB, no /resume) → respected ✓

**Placeholder scan** — every step contains concrete code or exact commands; no TBD/TODO. CSS is complete. The only "open" runtime step is the custom-domain attach in T12 Step 4, which has a dashboard fallback documented.

**Type consistency** — `DataClient` gains `getProject(slug)` in T8 and all consumers/mocks use it; `sortPosts`/`isRealPost` extracted in T9 and reused by home routes; `renderMarkdown` is async everywhere it's called; `NotFoundView` props (`path`, optional `message`) identical across T8/T10/T11; `applyFilter`/`collectTags` signatures stable between T7's server and client filter. ✓
