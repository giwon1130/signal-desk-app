import type { PreMarketForecastStats } from '../types/market'

export function conditionDataLabel(status: string) {
  return status === 'AVAILABLE' ? '자료 확인됨' : status === 'PARTIAL' ? '일부 지연·누락' : '판단에 필요한 자료 부족'
}

export function observationLabel(value?: string | null): string {
  if (!value) return '관측 시각 미확인'
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value + ' 일간 공표치'
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return '관측 시각 미확인'
  return date.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }) + ' KST'
}

export function canShowPremarketStats(stats?: PreMarketForecastStats | null): boolean {
  return stats?.status === 'EXPLORATORY_ONLY' && stats.evaluatedCount >= Math.max(30, stats.minimumDisplaySamples ?? 30) &&
    typeof stats.accuracyPct === 'number' && Number.isFinite(stats.accuracyPct) &&
    stats.accuracyPct >= 0 && stats.accuracyPct <= 100
}
