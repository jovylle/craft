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

  it('orders featured first, then by date desc', async () => {
    const html = await (await app.request('/blog')).text()
    const featuredIdx = html.indexOf('Project Factory')
    const cursorIdx = html.indexOf('Why I Used Cursor')
    expect(featuredIdx).toBeGreaterThan(-1)
    expect(featuredIdx).toBeLessThan(cursorIdx)
    expect(html).not.toContain('>blog-post<')
  })
})
