import { describe, it, expect } from 'vitest'
import { createApp } from '../src/app'
import { createMockClient } from './fixtures'

const app = createApp({ data: createMockClient() })

describe('smoke', () => {
  it('serves the homepage', async () => {
    const res = await app.request('https://example.com/')
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('<!doctype html>')
  })
})
