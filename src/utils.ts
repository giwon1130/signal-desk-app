import type { ChartPoint, WatchAlert } from './types'

export function formatSignedRate(value?: number | null) {
  if (value == null) return '-'
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
}

/**
 * 가격 입력 파싱 — 소수점("412.43")을 보존해 숫자로. 콤마/통화기호는 제거.
 * 잘못된 입력(점 2개 등)·음수는 0 → 호출부의 falsy 체크에서 저장이 막힌다.
 * 백엔드 가격 필드가 Int 라 저장 직전엔 Math.round 해서 보낸다 (US는 달러 단위 저장).
 */
export function parsePriceInput(text: string): number {
  const n = Number(text.replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) && n >= 0 ? n : 0
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

/**
 * 가격에 통화 prefix 붙여서 반환.
 *  · KR → "₩119,000"  (정수)
 *  · US → "$412.43"   (소수점 2자리)
 *  · market 모르면 formatNumber fallback
 *
 * 같은 화면에 ₩119,000 과 $412 가 같이 떠도 단위 혼동 안 되게 하기 위함.
 * 손익액/평가금액에도 동일하게 사용 (음수면 prefix 가 부호 다음에).
 */
export function formatPrice(value: number | null | undefined, market?: string | null): string {
  if (value == null || Number.isNaN(value)) return '—'
  const m = (market ?? '').toUpperCase()
  if (m === 'US') {
    const sign = value < 0 ? '-' : ''
    return `${sign}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  if (m === 'KR') {
    const sign = value < 0 ? '-' : ''
    return `${sign}₩${Math.abs(value).toLocaleString('ko-KR', { maximumFractionDigits: 0 })}`
  }
  return formatNumber(value)
}

/** 손익액 등 부호가 중요한 금액 — formatPrice + 양수에도 + 부호 */
export function formatSignedPrice(value: number | null | undefined, market?: string | null): string {
  if (value == null || Number.isNaN(value)) return '—'
  const sign = value > 0 ? '+' : ''
  return `${sign}${formatPrice(value, market)}`
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

/** 합성 위험도(1~10) 카드 팔레트. 점수가 높을수록 경계색. */
export function getCompositeRiskPalette(score: number) {
  if (score >= 8) {
    return {
      accent: '#be123c', backgroundColor: '#fff1f2', borderColor: '#fecdd3',
      badgeBackgroundColor: '#ffe4e6', badgeTextColor: '#be123c', track: '#fecdd3',
    }
  }
  if (score >= 5) {
    return {
      accent: '#c2410c', backgroundColor: '#fff7ed', borderColor: '#fed7aa',
      badgeBackgroundColor: '#ffedd5', badgeTextColor: '#c2410c', track: '#fed7aa',
    }
  }
  return {
    accent: '#0f766e', backgroundColor: '#ecfeff', borderColor: '#bae6fd',
    badgeBackgroundColor: '#cffafe', badgeTextColor: '#0f766e', track: '#bae6fd',
  }
}

/** 위험 sub-score(0~100) 막대 색 — 점수가 높을수록 위험색. */
export function getRiskScoreColor(score: number) {
  if (score >= 67) return '#dc2626'
  if (score >= 40) return '#d97706'
  return '#0d9488'
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
