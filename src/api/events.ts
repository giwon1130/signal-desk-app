import { API_BASE_URL } from '../api'
import type { ApiResponse, MarketEvent } from '../types'

export async function fetchUpcomingEvents(days = 14): Promise<MarketEvent[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/events/upcoming?days=${days}`, {
      headers: { Accept: 'application/json' },
    })
    const json = (await res.json()) as ApiResponse<MarketEvent[]>
    return json.success ? (json.data ?? []) : []
  } catch {
    return []
  }
}
