/**
 * 리그 공용 상수/헬퍼 — 여러 league_parts 에서 중복되던 포맷/상태/에러 로직 통합.
 */
import type { LeagueCurrency, LeagueStatus } from '../../types'
import { apiErrorMessage } from '../../utils/apiError'

/** 거래 수수료 0.3% (매수 시 추가 비용, 매도 시 수령액에서 차감). 백엔드 TradeService 와 동일. */
export const LEAGUE_FEE = 0.003
/** 한 종목 권장 최대 비중 30% (백엔드 미강제 — FE 경고용). */
export const MAX_POSITION_PCT = 0.3
/** 최대 참가 인원 (백엔드 MAX_PARTICIPANTS 와 동일). */
export const MAX_PARTICIPANTS = 10
/** 호스트/참가자 아바타 선택지. */
export const LEAGUE_AVATARS = ['🐱', '🦊', '🐶', '🐼', '🦁', '🐯', '🐵', '🐰', '🐸', '🐨', '🦄', '🐲']

/** 리그 통화로 금액 포맷. KRW=정수+원, USD=$+소수2자리. */
export function fmtMoney(value: number, currency: LeagueCurrency): string {
  if (currency === 'USD') {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return `${Math.round(value).toLocaleString('ko-KR')}원`
}

/** 가격 등 — 소수 2자리 + 천 단위 쉼표. 예: 355747.52 → "355,747.52" */
export function fmtNum(value: number, decimals = 2): string {
  return value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export function leagueStatusLabel(s: LeagueStatus | string): string {
  switch (s) {
    case 'DRAFT': return '준비 중'
    case 'OPEN': return '모집 중'
    case 'RUNNING': return '진행 중'
    case 'FINISHED': return '종료됨'
    default: return String(s)
  }
}

export function leagueStatusColor(s: LeagueStatus | string, palette: any): string {
  switch (s) {
    case 'RUNNING': return palette.brandAccent
    case 'OPEN': return palette.blue
    case 'FINISHED': return palette.inkMuted
    default: return palette.orange // DRAFT
  }
}

/** 배포된 웹 앱 베이스 — 리그 참가 링크 생성/공유용. */
export const LEAGUE_WEB_BASE = 'https://giwon1130.github.io/signal-desk-app/'

/** 코드가 담긴 참가 링크. 친구가 누르면 앱/웹에서 참가 모달이 자동으로 열린다. */
export function leagueJoinLink(code: string): string {
  return `${LEAGUE_WEB_BASE}?join=${encodeURIComponent(code)}`
}

/** 리그 코드 공유 메시지 (링크 포함). */
export function leagueShareMessage(name: string, code: string): string {
  return `Signal Desk 모의투자 "${name}" 같이 해요!\n참가 코드: ${code}\n${leagueJoinLink(code)}`
}

/**
 * 들어온 URL 에서 참가 코드 추출.
 * - 웹:  https://.../signal-desk-app/?join=S3QQ3
 * - 앱:  signaldesk://join?code=S3QQ3  (or league/join)
 */
export function parseJoinCode(url: string | null | undefined): string | null {
  if (!url) return null
  const m = url.match(/[?&](?:join|code)=([A-Za-z0-9]+)/)
  return m ? m[1].toUpperCase() : null
}

/** 참가 실패 사유를 사용자 문구로. 백엔드 LeagueService.join 메시지 기준. */
export function joinErrorMessage(raw: string): string {
  const s = (raw || '').toLowerCase()
  if (s.includes('full')) return '인원이 가득 찼어요 (최대 10명)'
  if (s.includes('finished')) return '이미 종료된 리그예요'
  if (s.includes('not found')) return '코드를 찾을 수 없어요'
  return apiErrorMessage(raw, '참가 실패 — 코드 확인')
}

/** 체결 실패 사유를 사용자 문구로. 백엔드 TradeService 메시지 기준. */
export function tradeErrorMessage(raw: string): string {
  const s = (raw || '').toLowerCase()
  if (s.includes('insufficient cash')) return '현금 부족'
  if (s.includes('insufficient quantity') || s.includes('no holding')) return '보유 수량 부족'
  if (s.includes('is closed')) return '시장 거래 시간 아님'
  if (s.includes('price not available')) return '시세 가져오기 실패'
  if (s.includes('not running')) return '아직 시작 안 됐거나 종료됨'
  if (s.includes('not a participant')) return '참가자가 아니에요'
  if (s.includes('marketscope') || s.includes('market not allowed')) return '이 리그에서 거래할 수 없는 시장이에요'
  return apiErrorMessage(raw, '체결 실패')
}
