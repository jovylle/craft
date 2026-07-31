import { z } from 'zod'
import {
  HomepageSchema,
  ProfileSchema,
  ProjectSchema,
  BlogPostSummarySchema,
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

// Task 2's ProjectsSchema/BlogIndexSchema default the wrapper array to [],
// which makes a missing wrapper key parse as valid. Requiring the key here
// keeps malformed payloads (e.g. { wrong: true }) failing loudly.
const ProjectsResponseSchema = z.object({ projects: z.array(ProjectSchema) })
const BlogIndexResponseSchema = z.object({ posts: z.array(BlogPostSummarySchema) })

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
      const { projects } = await getJsonWithFallback(ENDPOINTS.projects, ProjectsResponseSchema, 'projects')
      return projects.map((p) => ({ ...p, thumbnail: absoluteUrl(p.thumbnail, baseUrl) }))
    },
    getBlogIndex: async () => {
      const { posts } = await getJsonWithFallback(ENDPOINTS.blogIndex, BlogIndexResponseSchema, 'blogIndex')
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
