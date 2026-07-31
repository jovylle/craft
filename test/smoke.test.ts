import { describe, it, expect } from 'vitest'
import app from '../src/index'

describe('smoke', () => {
  it('responds on /', async () => {
    const res = await app.request('/')
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('craft')
  })
})
