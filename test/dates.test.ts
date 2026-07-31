import { describe, it, expect } from 'vitest'
import { formatDate } from '../src/lib/dates'

describe('formatDate', () => {
  it('formats an ISO date', () => expect(formatDate('2026-07-17')).toBe('Jul 17, 2026'))
  it('formats a datetime string', () => expect(formatDate('2026-02-28T00:35:15Z')).toContain('Feb 28, 2026'))
  it('returns empty for empty input', () => expect(formatDate('')).toBe(''))
  it('returns the raw value when unparseable', () => expect(formatDate('soon')).toBe('soon'))
})
