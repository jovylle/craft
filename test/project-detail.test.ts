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
