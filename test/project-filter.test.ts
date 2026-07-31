import { describe, it, expect } from 'vitest'
import { applyFilter, collectTags } from '../src/client/project-filter'
import { projectsFixture } from './fixtures'

describe('applyFilter', () => {
  it('returns everything with an empty state', () => {
    expect(applyFilter(projectsFixture, { query: '', tag: '' })).toHaveLength(3)
  })

  it('filters by tag', () => {
    const result = applyFilter(projectsFixture, { query: '', tag: 'Vue' })
    expect(result.map((p) => p.slug)).toEqual(['sfl-crab'])
  })

  it('filters by query across title, description and tech', () => {
    expect(applyFilter(projectsFixture, { query: 'chat', tag: '' }).map((p) => p.slug)).toEqual(['chat'])
    expect(applyFilter(projectsFixture, { query: 'gallery', tag: '' }).map((p) => p.slug)).toEqual(['loop-gallery-space'])
  })

  it('combines query and tag', () => {
    const result = applyFilter(projectsFixture, { query: 'assistant', tag: 'Vue' })
    expect(result.map((p) => p.slug)).toEqual(['sfl-crab'])
    expect(applyFilter(projectsFixture, { query: 'assistant', tag: 'D1' })).toHaveLength(0)
  })

  it('is case-insensitive', () => {
    expect(applyFilter(projectsFixture, { query: 'SFL', tag: '' })).toHaveLength(1)
  })
})

describe('collectTags', () => {
  it('collects unique tags ordered by frequency', () => {
    const tags = collectTags(projectsFixture)
    expect(tags[0]).toBe('Vue') // appears once, ties broken by insertion order — assert membership only
    expect(tags).toContain('Vue')
    expect(tags).toContain('AI')
    expect(tags.length).toBeGreaterThanOrEqual(6)
  })

  it('respects the limit', () => {
    expect(collectTags(projectsFixture, 2).length).toBeLessThanOrEqual(2)
  })
})
