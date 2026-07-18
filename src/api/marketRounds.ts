import { API_BASE_URL } from '../api'
import type { ApiResponse, MarketRound } from '../types'

/** 진행 중인 이벤트 라운드 1개. 없거나 실패하면 카드 자체를 숨긴다. */
export async function fetchActiveMarketRound(): Promise<MarketRound | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/market-rounds/active`, {
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return null
    const json = (await res.json()) as ApiResponse<MarketRound | null>
    return json.success ? json.data ?? null : null
  } catch {
    return null
  }
}
