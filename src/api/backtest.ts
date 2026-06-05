import { API_BASE_URL } from '../api'
import type { SeasonalityReport } from '../types/backtest'

type ApiResponse<T> = { success: boolean; data: T | null }

/** 종목 시즈널리티 리포트 (공개 — 인증 불필요). */
export async function fetchSeasonality(
  market: string,
  ticker: string,
  name = '',
  years = 12,
): Promise<SeasonalityReport | null> {
  try {
    const q = new URLSearchParams({ market, ticker, name, years: String(years) })
    const res = await fetch(`${API_BASE_URL}/api/v1/backtest/seasonality?${q.toString()}`, {
      headers: { Accept: 'application/json' },
    })
    const json = (await res.json()) as ApiResponse<SeasonalityReport>
    return json.success ? json.data : null
  } catch {
    return null
  }
}
