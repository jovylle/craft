import { describe, it, expect } from 'vitest'
import { TtlCache } from '../src/lib/ttl-cache'

describe('TtlCache', () => {
  it('returns undefined for a missing key', () => {
    const cache = new TtlCache<string>(1000)
    expect(cache.get('nope')).toBeUndefined()
  })

  it('returns the value before expiry and clears it after', () => {
    let now = 0
    const cache = new TtlCache<string>(1000, () => now)
    cache.set('k', 'v')
    expect(cache.get('k')).toBe('v')
    now = 1001
    expect(cache.get('k')).toBeUndefined()
  })

  it('peek returns stale values without deleting them', () => {
    let now = 0
    const cache = new TtlCache<string>(1000, () => now)
    cache.set('k', 'v')
    now = 5000
    expect(cache.peek('k')).toBe('v')
    expect(cache.get('k')).toBeUndefined()
  })

  it('clear removes everything', () => {
    const cache = new TtlCache<string>(1000)
    cache.set('a', '1')
    cache.set('b', '2')
    cache.clear()
    expect(cache.get('a')).toBeUndefined()
    expect(cache.get('b')).toBeUndefined()
  })
})
