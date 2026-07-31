import { describe, it, expect } from 'vitest'
import { projectsRoutes } from '../src/routes/projects'
import { createMockClient } from './fixtures'

const app = projectsRoutes(createMockClient(), 'https://content.jovylle.com')

describe('GET /projects', () => {
  it('returns 200 with all project cards sorted by priority', async () => {
    const res = await app.request('/projects')
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
    const html = await (await app.request('/projects')).text()
    expect(html).toContain('data-search')
    expect(html).toContain('data-project-grid')
    expect(html).toContain('data-tags="Vue,Nuxt"')
  })
})
