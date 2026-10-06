import { earningsCoverageNote, formatChartDate } from '../utils/marketDataPresentation'

test('chart dates preserve exchange date without device time-zone conversion', () => {
  expect(formatChartDate('20261005')).toBe('2026.10.05')
  expect(formatChartDate(undefined)).toBe('기준일 미확인')
})

test.each(['NOT_CONFIGURED', 'NOT_LOADED', 'UNAVAILABLE', 'INVALID'])('unavailable earnings %s do not claim no events', (status) => {
  expect(earningsCoverageNote(status)).toContain('일정이 없다는 뜻은 아니며')
})

test('available calendars still explain their limited universe', () => {
  expect(earningsCoverageNote('AVAILABLE')).toContain('누락될 수 있습니다')
  expect(earningsCoverageNote(undefined)).toBeNull()
})
