import type { ChartPoint, WatchAlert } from './types'

export function formatSignedRate(value?: number | null) {
  if (value == null) return '-'
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
}

export function formatCompactNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toLocaleString('ko-KR')
}

/**
 * 풀 금액 표시 (천단위 콤마, 천원 단위로 압축 안 함).
 * 가격·평가금액·손익액 같은 "정확한 숫자가 중요한 값" 에 사용.
 * 대량 누적 거래량처럼 자릿수만 보고 싶은 값은 formatCompactNumber 사용.
 */
export function formatNumber(n: number | null | undefined, digits = 0) {
  if (n == null || Number.isNaN(n)) return '—'
  return n.toLocaleString('ko-KR', { maximumFractionDigits: digits })
}

export function getMarketStatusTone(status?: string) {
  if (!status) return '#64748b'
  if (status.includes('OPEN') || status.includes('REGULAR')) return '#0f766e'
  if (status.includes('PRE') || status.includes('AFTER')) return '#a16207'
  return '#475569'
}

/**
 * 서버가 내려주는 raw enum (`KR_REGULAR_OPEN`, `US_PRE_MARKET` 등)을
 * 사용자에게 보여줄 한국어 라벨로 변환.
 * 매핑 없는 값은 관용적으로 lowercase → 공백 치환 → title-case 정도만 해서 그대로 노출.
 */
export function formatMarketStatus(status?: string): string {
  if (!status) return '-'
  const map: Record<string, string> = {
    KR_PRE_MARKET:       '한국 장 전',
    KR_REGULAR_OPEN:     '한국 정규장',
    KR_REGULAR_CLOSE:    '한국 마감',
    KR_AFTER_MARKET:     '한국 장 후',
    KR_CLOSED:           '한국 휴장',
    US_PRE_MARKET:       '미국 프리마켓',
    US_REGULAR_OPEN:     '미국 정규장',
    US_REGULAR_CLOSE:    '미국 마감',
    US_AFTER_MARKET:     '미국 애프터마켓',
    US_CLOSED:           '미국 휴장',
    ALL_OPEN:            '전 시장 개장',
    ALL_CLOSED:          '전 시장 휴장',
  }
  if (map[status]) return map[status]
  // unknown enum fallback — "KR_SOMETHING_NEW" → "Kr Something New"
  return status
    .toLowerCase()
    .split('_')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')
}

export function getLogReturnColor(value?: number | null) {
  if (value == null) return '#64748b'
  return value >= 0 ? '#dc2626' : '#2563eb'
}

export function getSessionPalette(isOpen: boolean) {
  return isOpen
    ? { backgroundColor: '#dcfce7', textColor: '#166534' }
    : { backgroundColor: '#e2e8f0', textColor: '#334155' }
}

export function getMetricAccent(score: number) {
  if (score >= 70) return '#0f766e'
  if (score >= 40) return '#a16207'
  return '#b91c1c'
}

export function getAlternativeSignalPalette(score: number) {
  if (score >= 75) {
    return {
      backgroundColor: '#fff1f2',
      borderColor: '#fecdd3',
      badgeBackgroundColor: '#ffe4e6',
      badgeTextColor: '#be123c',
    }
  }
  if (score >= 45) {
    return {
      backgroundColor: '#fff7ed',
      borderColor: '#fed7aa',
      badgeBackgroundColor: '#ffedd5',
      badgeTextColor: '#c2410c',
    }
  }
  return {
    backgroundColor: '#ecfeff',
    borderColor: '#bae6fd',
    badgeBackgroundColor: '#cffafe',
    badgeTextColor: '#0f766e',
  }
}

export function getAlertPalette(severity: WatchAlert['severity']) {
  if (severity === 'high') {
    return { backgroundColor: '#fff1f2', borderColor: '#fecdd3', badgeColor: '#be123c', badgeBackgroundColor: '#ffe4e6' }
  }
  if (severity === 'medium') {
    return { backgroundColor: '#fff7ed', borderColor: '#fed7aa', badgeColor: '#c2410c', badgeBackgroundColor: '#ffedd5' }
  }
  return { backgroundColor: '#ecfeff', borderColor: '#bae6fd', badgeColor: '#0f766e', badgeBackgroundColor: '#cffafe' }
}

export function normalizeText(value: string) {
  return value.trim().toLowerCase()
}

/**
 * ISO-8601 → "방금 전 / N분 전 / N시간 전 / 오늘 HH:MM / 어제 HH:MM / MM/DD HH:MM" 형식.
 * 백엔드가 RSS pubDate 를 변환해 NewsHighlight.publishedAt 으로 내려주는 걸 화면에서 사람 읽기 좋게.
 * 파싱 실패하면 빈 문자열 — 호출 측이 빈 값이면 표시 생략.
 */
export function formatRelativeOrShortTime(iso: string | null | undefined, now: Date = new Date()): string {
  if (!iso) return ''
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return ''
  const diffMs = now.getTime() - t
  const diffMin = Math.round(diffMs / 60_000)
  if (diffMin < 1) return '방금 전'
  if (diffMin < 60) return `${diffMin}분 전`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 6) return `${diffHr}시간 전`
  const d = new Date(t)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  // 오늘 / 어제 / 그 외
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  if (isSameDay(d, now)) return `오늘 ${hh}:${mm}`
  const yest = new Date(now); yest.setDate(yest.getDate() - 1)
  if (isSameDay(d, yest)) return `어제 ${hh}:${mm}`
  const MM = String(d.getMonth() + 1).padStart(2, '0')
  const DD = String(d.getDate()).padStart(2, '0')
  return `${MM}/${DD} ${hh}:${mm}`
}

/** 마지막 동기화용 — 항상 "MM/DD HH:MM" 풀 형식. (방금 전이라도 날짜 보이는 게 정확.) */
export function formatSyncStamp(date: Date): string {
  const MM = String(date.getMonth() + 1).padStart(2, '0')
  const DD = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${MM}/${DD} ${hh}:${mm}`
}

export function buildMovingAverage(points: ChartPoint[], period: number) {
  return points.map((_, index) => {
    if (index + 1 < period) return null
    const window = points.slice(index + 1 - period, index + 1)
    return window.reduce((acc, item) => acc + item.close, 0) / period
  })
}

export function buildLinePath(
  values: Array<number | null>,
  xAt: (index: number) => number,
  yAt: (value: number) => number,
) {
  let d = ''
  values.forEach((value, index) => {
    if (value == null) return
    const x = xAt(index)
    const y = yAt(value)
    d += d ? ` L ${x} ${y}` : `M ${x} ${y}`
  })
  return d
}
