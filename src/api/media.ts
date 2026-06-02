import { API_BASE_URL } from '../api'
import type { ApiResponse, MediaSummaryItem } from '../types'

/** 최근 미디어 요약 N건 — 오늘 탭 브리프 카드용(최신순). 실패 시 빈 배열. */
export async function fetchRecentMediaSummaries(limit = 6): Promise<MediaSummaryItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/media/summaries/recent?limit=${limit}`, {
      headers: { Accept: 'application/json' },
    })
    const json = (await res.json()) as ApiResponse<MediaSummaryItem[] | null>
    return json.success ? json.data ?? [] : []
  } catch {
    return []
  }
}
