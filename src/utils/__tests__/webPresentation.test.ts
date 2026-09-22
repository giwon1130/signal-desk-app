import { columnsForWidth, forMarket, quoteState } from '../webPresentation'

describe('web presentation', () => {
  test.each([[360, 1], [600, 1], [640, 2], [920, 2], [960, 3]])('columns fit container %s', (width, expected) => {
    expect(columnsForWidth(width, 3)).toBe(expected)
  })
  test('market filter preserves unknown markets only in BOTH', () => {
    const items = [{ market: 'KR' }, { market: 'US' }, { market: 'GLOBAL' }]
    expect(forMarket(items, 'KR')).toEqual([{ market: 'KR' }])
    expect(forMarket(items, 'US')).toEqual([{ market: 'US' }])
    expect(forMarket(items, 'BOTH')).toBe(items)
  })
  test('quote freshness does not invent a live status', () => {
    const now = Date.parse('2026-09-22T10:00:00Z')
    expect(quoteState(undefined, now)).toBe('missing')
    expect(quoteState('invalid', now)).toBe('missing')
    expect(quoteState('2026-09-23T10:00:00Z', now)).toBe('missing')
    expect(quoteState('2026-09-22T09:00:00Z', now)).toBe('stale')
    expect(quoteState('2026-09-22T09:59:00Z', now)).toBe('recent')
  })
})
