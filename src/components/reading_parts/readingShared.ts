/**
 * 리딩 공용 상수/헬퍼 — 가격/수익률 포맷, 상태, 공유/딥링크, 에러 매핑.
 * (league_parts/leagueShared 와 동일한 패턴)
 */
import type { CallCurrency, CallStatus } from '../../types'
import { apiErrorMessage } from '../../utils/apiError'

/** 진입가/현재가 — 통화별 포맷. KRW=정수+원, USD=$+소수2자리, 둘 다 천 단위 쉼표. */
export function fmtPrice(value: number, currency: CallCurrency): string {
  if (currency === 'USD') {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return `${Math.round(value).toLocaleString('ko-KR')}원`
}

/** 수익률 % — 부호 포함. 예: 5.23 → "+5.2%", -3.1 → "-3.1%" (이미 % 단위). */
export function fmtPct(value: number, decimals = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`
}

/** 수익률 색 — 한국식(상승=빨강 up / 하락=파랑 down), 0/없음은 중립. */
export function returnColor(returnPct: number | null | undefined, palette: any): string {
  if (returnPct == null) return palette.inkFaint
  if (returnPct > 0) return palette.up
  if (returnPct < 0) return palette.down
  return palette.inkMuted
}

/** 콜 상태 뱃지 — ACTIVE 는 뱃지 없음. */
export function callStatusBadge(status: CallStatus, palette: any): { label: string; color: string } | null {
  if (status === 'HIT') return { label: '적중', color: palette.up }
  if (status === 'CLOSED') return { label: '종료', color: palette.inkMuted }
  return null
}

// ─── 공유 / 딥링크 ────────────────────────────────────────────────────────────
export const READING_WEB_BASE = 'https://giwon1130.github.io/signal-desk-app/'

/** 리더 구독 링크. 친구가 누르면 구독 코드가 채워진다. */
export function readingLeaderLink(code: string): string {
  return `${READING_WEB_BASE}?leader=${encodeURIComponent(code)}`
}

/** 리더 코드 공유 메시지(링크 포함). */
export function readingShareMessage(displayName: string, code: string): string {
  return `Signal Desk 리딩 — "${displayName}"님 콜 구독하기!\n구독 코드: ${code}\n${readingLeaderLink(code)}`
}

/** 들어온 URL 에서 리더 구독 코드 추출. ?leader=CODE / signaldesk://leader?code=CODE */
export function parseLeaderCode(url: string | null | undefined): string | null {
  if (!url) return null
  const m = url.match(/[?&]leader=([A-Za-z0-9]+)/)
  return m ? m[1].toUpperCase() : null
}

/** 구독 실패 사유 → 사용자 문구. 백엔드 메시지 기준(best-effort). */
export function subscribeErrorMessage(raw: string): string {
  const s = (raw || '').toLowerCase()
  if (s.includes('self') || s.includes('yourself') || s.includes('own')) return '내 코드는 구독할 수 없어요'
  if (s.includes('approved')) return '아직 승인된 리더가 아니에요'
  if (s.includes('not found') || s.includes('invalid')) return '코드를 찾을 수 없어요'
  return apiErrorMessage(raw, '구독 실패 — 코드 확인')
}
