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
    expect(html).toContain('<h1 class="hero-title">')
    expect(html).toContain('It&#39;s') // first hero word; hono escapes the apostrophe and splits words into spans
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
