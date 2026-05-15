import { API_BASE_URL } from '../api'
import type { ApiResponse, MediaSummaryItem } from '../types'

export async function fetchLatestMediaSummary(): Promise<MediaSummaryItem | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/media/summaries/latest`, {
      headers: { Accept: 'application/json' },
    })
    const json = (await res.json()) as ApiResponse<MediaSummaryItem | null>
    return json.success ? json.data ?? null : null
  } catch {
    return null
  }
}
