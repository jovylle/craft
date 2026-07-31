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
