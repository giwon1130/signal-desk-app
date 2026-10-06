import { canShowPremarketStats, conditionDataLabel, observationLabel } from '../utils/marketCondition'
import type { PreMarketForecastStats } from '../types/market'

const stats = (count: number): PreMarketForecastStats => ({
  evaluatedCount: count, correctCount: count, accuracyPct: 100, windowSize: 60, status: 'EXPLORATORY_ONLY', minimumDisplaySamples: 30,
})
test('small and legacy samples are never marketed as verified accuracy', () => {
  expect(canShowPremarketStats(stats(5))).toBe(false)
  expect(canShowPremarketStats(stats(29))).toBe(false)
  expect(canShowPremarketStats(stats(30))).toBe(true)
  expect(canShowPremarketStats({ ...stats(60), status: undefined })).toBe(false)
  expect(canShowPremarketStats({ ...stats(60), accuracyPct: NaN })).toBe(false)
  expect(canShowPremarketStats(null)).toBe(false)
})
test('unknown data is not neutral and daily publications are not live timestamps', () => {
  expect(conditionDataLabel('INSUFFICIENT')).toContain('자료 부족')
  expect(conditionDataLabel('PARTIAL')).toContain('지연')
  expect(observationLabel('2026-10-06')).toBe('2026-10-06 일간 공표치')
  expect(observationLabel(null)).toContain('미확인')
  expect(observationLabel('invalid')).toContain('미확인')
  expect(observationLabel('2026-10-06T05:00:00Z')).toContain('14:00')
})
