import type { QuoteInfo } from '../types/workspace'

export function quoteLabel(info?: QuoteInfo | null, now = Date.now()): string {
  if (!info || !Number.isFinite(Date.parse(info.observedAt))) return '시세 기준 시각을 확인하지 못했습니다. 주문 전 증권사 시세를 확인해 주세요.'
  const stamp = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(info.observedAt))
  const age = now - Date.parse(info.observedAt)
  const status = info.session === 'CLOSE' ? '최근 정규장 종가'
    : age > 300_000 || age < -60_000 ? '이전 시세'
    : info.delayMinutes == null ? '지연 여부 미확인'
    : info.delayMinutes > 0 ? `${info.delayMinutes}분 지연` : '최근 수신 시세'
  return `${status} · ${stamp} KST · 네이버 금융`
}
