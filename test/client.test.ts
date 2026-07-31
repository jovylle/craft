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
