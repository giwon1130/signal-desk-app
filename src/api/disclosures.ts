import { API_BASE_URL } from '../api'
import type { ApiResponse, DisclosureItem } from '../types'

/** 보유/관심 KR 종목의 최근 DART 공시. 인증 필요 — 비로그인 시 빈 배열. */
export async function fetchRecentDisclosures(authToken: string, limit = 30): Promise<DisclosureItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/disclosures/recent?limit=${limit}`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    })
    const json = (await res.json()) as ApiResponse<{ disclosures: DisclosureItem[] }>
    return json.success ? (json.data?.disclosures ?? []) : []
  } catch {
    return []
  }
}
