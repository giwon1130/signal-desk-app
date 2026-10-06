import { API_BASE_URL, authedFetch } from '../api'
import type { ApiResponse, MarketEvent } from '../types'

export type EventSnapshot = { events: MarketEvent[]; earningsStatus: string }

export async function fetchEventSnapshot(days = 14): Promise<EventSnapshot> {
  try {
    const res = await authedFetch(`${API_BASE_URL}/api/v1/events/upcoming?days=${days}`, {
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return { events: [], earningsStatus: 'UNAVAILABLE' }
    const json = (await res.json()) as ApiResponse<MarketEvent[]> & { earningsStatus?: { status: string } }
    return json.success ? { events: json.data ?? [], earningsStatus: json.earningsStatus?.status ?? 'NOT_LOADED' }
      : { events: [], earningsStatus: 'UNAVAILABLE' }
  } catch {
    return { events: [], earningsStatus: 'UNAVAILABLE' }
  }
}

export async function fetchUpcomingEvents(days = 14): Promise<MarketEvent[]> {
  return (await fetchEventSnapshot(days)).events
}
