export function columnsForWidth(width: number, columns = 2, minColumnWidth = 300): number {
  return Math.max(1, Math.min(columns, Math.floor((Math.max(0, width) + 16) / (minColumnWidth + 16))))
}

export function forMarket<T extends { market: string }>(items: T[], market: 'KR' | 'US' | 'BOTH'): T[] {
  return market === 'BOTH' ? items : items.filter((item) => item.market === market)
}

export function quoteState(asOf?: string | null, now = Date.now()): 'recent' | 'stale' | 'missing' {
  if (!asOf) return 'missing'
  const time = Date.parse(asOf)
  if (!Number.isFinite(time) || time > now + 300_000) return 'missing'
  return now - time > 15 * 60_000 ? 'stale' : 'recent'
}
