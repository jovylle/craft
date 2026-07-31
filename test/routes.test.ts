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
    expect(html).toContain('It&#39;s')
    expect(html).toContain('Open to opportunities')
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
