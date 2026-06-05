import { API_BASE_URL, authedFetch } from '../api'
import type { SeasonalityReport, SeasonalityRule } from '../types/backtest'

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

/** 내 시즌 규칙 목록 (인증). */
export async function listSeasonalityRules(): Promise<SeasonalityRule[]> {
  try {
    const res = await authedFetch(`${API_BASE_URL}/api/v1/backtest/rules`, { headers: { Accept: 'application/json' } })
    const json = (await res.json()) as ApiResponse<SeasonalityRule[]>
    return json.success ? json.data ?? [] : []
  } catch {
    return []
  }
}

type SaveRuleInput = {
  market: string; ticker: string; name?: string
  kind: 'BUY_MONTH' | 'AVOID_MONTH'; month: number
  meanPct?: number | null; winRatePct?: number | null; sampleYears?: number | null
}

/** 시즌 규칙 저장 (인증). 같은 종목·종류·월은 갱신. */
export async function saveSeasonalityRule(input: SaveRuleInput): Promise<SeasonalityRule | null> {
  try {
    const res = await authedFetch(`${API_BASE_URL}/api/v1/backtest/rules`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    const json = (await res.json()) as ApiResponse<SeasonalityRule>
    return json.success ? json.data : null
  } catch {
    return null
  }
}

/** 시즌 규칙 삭제 (인증). */
export async function deleteSeasonalityRule(id: string): Promise<boolean> {
  try {
    const res = await authedFetch(`${API_BASE_URL}/api/v1/backtest/rules/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    })
    const json = (await res.json()) as ApiResponse<boolean>
    return json.success ? json.data ?? false : false
  } catch {
    return false
  }
}
