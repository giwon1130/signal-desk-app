import {
  formatNumber,
  formatPrice,
  formatRelativeOrShortTime,
  formatSignedPrice,
  formatSignedRate,
  formatSyncStamp,
  normalizeText,
} from '../utils'

/**
 * 순수 함수 단위 테스트.
 * 화면 어디서든 가격/시각/통화 표시에 쓰이는 공통 헬퍼 — 회귀 방지가 핵심.
 */

describe('formatNumber', () => {
  it('정수면 천단위 콤마', () => {
    expect(formatNumber(1234567)).toBe('1,234,567')
    expect(formatNumber(0)).toBe('0')
  })
  it('null/NaN 은 dash', () => {
    expect(formatNumber(null)).toBe('—')
    expect(formatNumber(undefined)).toBe('—')
    expect(formatNumber(NaN)).toBe('—')
  })
  it('digits 옵션으로 소수점 자릿수 제한', () => {
    expect(formatNumber(123.456, 2)).toBe('123.46')
  })
})

describe('formatPrice', () => {
  it('KR 은 원화 prefix + 정수', () => {
    expect(formatPrice(119000, 'KR')).toBe('₩119,000')
  })
  it('US 는 달러 prefix + 소수점 2자리', () => {
    expect(formatPrice(412.43, 'US')).toBe('$412.43')
    expect(formatPrice(412, 'US')).toBe('$412.00')
  })
  it('음수도 부호 처리', () => {
    expect(formatPrice(-1000, 'KR')).toBe('-₩1,000')
    expect(formatPrice(-1.5, 'US')).toBe('-$1.50')
  })
  it('market 모르면 fallback (formatNumber)', () => {
    expect(formatPrice(1000, undefined)).toBe('1,000')
    expect(formatPrice(1000, '')).toBe('1,000')
  })
  it('null 은 dash', () => {
    expect(formatPrice(null, 'KR')).toBe('—')
    expect(formatPrice(NaN, 'US')).toBe('—')
  })
})

describe('formatSignedPrice', () => {
  it('양수면 + 부호', () => {
    expect(formatSignedPrice(5000, 'KR')).toBe('+₩5,000')
    expect(formatSignedPrice(1.23, 'US')).toBe('+$1.23')
  })
  it('음수는 - 부호 (formatPrice 가 처리)', () => {
    expect(formatSignedPrice(-5000, 'KR')).toBe('-₩5,000')
  })
  it('0 은 부호 없음', () => {
    expect(formatSignedPrice(0, 'KR')).toBe('₩0')
  })
})

describe('formatSignedRate', () => {
  it('양수 +, 음수 -, 소수점 2자리 + %', () => {
    expect(formatSignedRate(2.5)).toBe('+2.50%')
    expect(formatSignedRate(-1.5)).toBe('-1.50%')
    expect(formatSignedRate(0)).toBe('0.00%')
  })
  it('null 은 dash', () => {
    expect(formatSignedRate(null)).toBe('-')
  })
})

describe('formatRelativeOrShortTime', () => {
  const now = new Date('2026-04-25T12:00:00Z')

  it('30초 차이는 round 후 1분 전 (Math.round 동작)', () => {
    // diffMs=30000 → 30000/60000 = 0.5 → Math.round → 1 → "1분 전" 분기
    const t = new Date(now.getTime() - 30_000).toISOString()
    expect(formatRelativeOrShortTime(t, now)).toBe('1분 전')
  })
  it('5초 차이는 방금 전 (round 0)', () => {
    const t = new Date(now.getTime() - 5_000).toISOString()
    expect(formatRelativeOrShortTime(t, now)).toBe('방금 전')
  })
  it('1시간 미만은 N분 전', () => {
    const t = new Date(now.getTime() - 30 * 60_000).toISOString()
    expect(formatRelativeOrShortTime(t, now)).toBe('30분 전')
  })
  it('6시간 미만은 N시간 전', () => {
    const t = new Date(now.getTime() - 3 * 3600_000).toISOString()
    expect(formatRelativeOrShortTime(t, now)).toBe('3시간 전')
  })
  it('빈 입력 / 깨진 ISO 는 빈 문자열', () => {
    expect(formatRelativeOrShortTime(null, now)).toBe('')
    expect(formatRelativeOrShortTime(undefined, now)).toBe('')
    expect(formatRelativeOrShortTime('not-a-date', now)).toBe('')
  })
})

describe('formatSyncStamp', () => {
  it('MM/DD HH:MM 형식', () => {
    // 로컬 타임존 의존 — 검증은 형식만
    const stamp = formatSyncStamp(new Date('2026-04-25T01:24:00Z'))
    expect(stamp).toMatch(/^\d{2}\/\d{2} \d{2}:\d{2}$/)
  })
})

describe('normalizeText', () => {
  it('trim + lowercase', () => {
    expect(normalizeText('  ABC  ')).toBe('abc')
    expect(normalizeText('한글Test')).toBe('한글test')
  })
})
