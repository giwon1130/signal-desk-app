import type { MoverReason } from '../types'

export function findMoverReason(reasons: MoverReason[], market: string, ticker: string, changeRate: number, now = Date.now()): MoverReason | undefined {
  return reasons.find((r) => {
    if (r.market !== market || r.ticker !== ticker || !Number.isFinite(r.changeRate) || !Number.isFinite(changeRate)) return false
    if (Math.sign(r.changeRate) !== Math.sign(changeRate)) return false
    if (!r.context) return true // Old API contract remains readable.
    const timestamp = Date.parse(r.context.asOf)
    return Number.isFinite(timestamp) && timestamp <= now + 5_000 && now - timestamp <= 10 * 60_000
  })
}

export function moveContextLabel(status?: string): string {
  switch (status) {
    case 'EVIDENCE_FOUND': return '확인된 소식'
    case 'MARKET_CONTEXT': return '함께 볼 시장 흐름'
    case 'NO_RECENT_CATALYST': return '가격 흐름 확인'
    case 'UNAVAILABLE': return '자료 조회 지연'
    default: return '관련 소식'
  }
}

export function safeEvidenceUrl(url: string): boolean {
  try { const parsed = new URL(url); return ['http:', 'https:'].includes(parsed.protocol) && !!parsed.hostname && !parsed.username && !parsed.password }
  catch { return false }
}
