import { decimalInput, validHoldingInput } from '../utils/decimalInput'
import { marketReminderSchedule, type TradingCalendar } from '../utils/marketReminderSchedule'
import { extractPortfolioCandidates } from '../utils/portfolioOcr'
import { quoteLabel } from '../utils/quoteLabel'

describe('미국장 입력과 시세 표시', () => {
  test('센트와 소수점 수량을 보존하고 손상된 숫자를 바꾸어 해석하지 않는다', () => {
    expect(decimalInput('$204.15')).toBe(204.15)
    expect(decimalInput('0.5')).toBe(0.5)
    expect(decimalInput('1,234.56')).toBe(1234.56)
    for (const text of ['0,5', '1.2.3', '-10', 'NaN', 'Infinity', '0.123456789', '1e3']) expect(decimalInput(text)).toBe(0)
    expect(validHoldingInput('US', 204.15, 0.5)).toBe(true)
    expect(validHoldingInput('KR', 70000, 0.5)).toBe(false)
  })
  test('OCR에서 0.5주를 1주로 반올림하지 않는다', () => {
    const result = extractPortfolioCandidates({ width: 400, height: 800, lines: [
      { text: 'AAPL', left: 10, right: 100, top: 100, bottom: 112 },
      { text: '매수가 204.15', left: 160, right: 240, top: 100, bottom: 112 },
      { text: '0.5주', left: 300, right: 350, top: 100, bottom: 112 },
    ] })
    expect(result[0]).toMatchObject({ query: 'AAPL', buyPrice: 204.15, quantity: 0.5 })
  })
  test('마감 가격을 실시간 시세로 소개하지 않는다', () => {
    expect(quoteLabel({ source: 'NAVER_FINANCE', currency: 'USD', session: 'CLOSE', observedAt: '2026-10-05T20:00:00Z', delayMinutes: 0 })).toContain('최근 정규장 종가')
    expect(quoteLabel(null)).toContain('기준 시각을 확인하지 못했습니다')
  })
})

describe('거래일별 장 시작 예약', () => {
  const now = Date.parse('2026-10-30T00:00:00Z')
  const calendar: TradingCalendar = { generatedAt: new Date(now).toISOString(), coverageThrough: { US: '2026-11-26' }, sessions: [
    { market: 'US', tradingDate: '2026-10-30', opensAt: '2026-10-30T13:30:00Z', closesAt: '2026-10-30T20:00:00Z', earlyClose: false },
    { market: 'US', tradingDate: '2026-11-02', opensAt: '2026-11-02T14:30:00Z', closesAt: '2026-11-02T21:00:00Z', earlyClose: false },
  ] }
  test('서머타임 전환 후 날짜에 해당하는 절대 시각으로 예약한다', () => {
    expect(marketReminderSchedule(calendar, { KR: false, US: true }, 10, now).map((r) => new Date(r.at).toISOString())).toEqual([
      '2026-10-30T13:20:00.000Z', '2026-11-02T14:20:00.000Z',
    ])
  })
  test('캘린더에 없는 휴일을 만들지 않으며 비활성·만료 자료는 예약하지 않는다', () => {
    expect(marketReminderSchedule(calendar, { KR: false, US: true }, 10, now)).toHaveLength(2)
    expect(marketReminderSchedule(calendar, { KR: false, US: false }, 10, now)).toEqual([])
    expect(marketReminderSchedule(calendar, { KR: false, US: true }, 10, now + 86_400_001)).toEqual([])
  })
  test('중복 예약과 이미 지난 예약을 제거한다', () => {
    const duplicate = { ...calendar, sessions: [...calendar.sessions, calendar.sessions[0]] }
    expect(marketReminderSchedule(duplicate, { KR: false, US: true }, 10, now)).toHaveLength(2)
    expect(marketReminderSchedule(calendar, { KR: false, US: true }, 10, Date.parse('2026-10-30T13:25:00Z'))).toHaveLength(1)
  })
})
