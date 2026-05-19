import { API_BASE_URL } from '../api'
import type { ApiResponse, MarketInsightData } from '../types'

export async function fetchMarketInsight(): Promise<MarketInsightData | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/insights/today`, {
      headers: { Accept: 'application/json' },
    })
    const json = (await res.json()) as ApiResponse<MarketInsightData | null>
    return json.success ? json.data ?? null : null
  } catch {
    return null
  }
}
