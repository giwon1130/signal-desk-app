import { API_BASE_URL, authedFetch } from '../api'

type ApiResponse<T> = { success: boolean; data: T | null }

export type PlanRequestStatus = 'PENDING' | 'APPROVED' | 'DISMISSED' | null

/** PRO 신청 — 성공/실패 모두 사용자에게 보여줄 메시지 반환. */
export async function requestPro(): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await authedFetch(`${API_BASE_URL}/api/v1/plan/request`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
    })
    const json = (await res.json()) as ApiResponse<string>
    return { ok: json.success, message: json.data ?? '신청에 실패했어요. 잠시 후 다시 시도해 주세요.' }
  } catch {
    return { ok: false, message: '서버에 연결할 수 없어요.' }
  }
}

/** 내 PRO 신청 상태 (없으면 null). */
export async function fetchMyPlanRequest(): Promise<PlanRequestStatus> {
  try {
    const res = await authedFetch(`${API_BASE_URL}/api/v1/plan/request`, { headers: { Accept: 'application/json' } })
    const json = (await res.json()) as ApiResponse<{ status: PlanRequestStatus }>
    return json.success ? json.data?.status ?? null : null
  } catch {
    return null
  }
}
