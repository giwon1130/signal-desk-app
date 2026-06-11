import { API_BASE_URL, authedFetch } from '../api'

export type AdminOverview = {
  totalUsers: number
  proUsers: number
  pushDevices: number
  watchItems: number
  portfolioPositions: number
  assistantQuestionsToday: number
  alertsSentToday: number
}

export type AdminUser = {
  id: string
  email: string
  nickname: string
  plan: string
  createdAt: string
  questionsToday: number
}

type ApiResponse<T> = { success: boolean; data: T | null }

export async function fetchAdminOverview(): Promise<AdminOverview | null> {
  try {
    const res = await authedFetch(`${API_BASE_URL}/api/v1/admin/overview`, { headers: { Accept: 'application/json' } })
    const json = (await res.json()) as ApiResponse<AdminOverview>
    return json.success ? json.data : null
  } catch { return null }
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  try {
    const res = await authedFetch(`${API_BASE_URL}/api/v1/admin/users`, { headers: { Accept: 'application/json' } })
    const json = (await res.json()) as ApiResponse<AdminUser[]>
    return json.success ? json.data ?? [] : []
  } catch { return [] }
}

export type PlanRequest = {
  userId: string
  email: string
  nickname: string
  plan: string
  requestedAt: string
}

export async function fetchPlanRequests(): Promise<PlanRequest[]> {
  try {
    const res = await authedFetch(`${API_BASE_URL}/api/v1/admin/plan-requests`, { headers: { Accept: 'application/json' } })
    const json = (await res.json()) as ApiResponse<PlanRequest[]>
    return json.success ? json.data ?? [] : []
  } catch { return [] }
}

export async function resolvePlanRequest(userId: string, action: 'approve' | 'dismiss'): Promise<boolean> {
  try {
    const res = await authedFetch(`${API_BASE_URL}/api/v1/admin/plan-requests/${encodeURIComponent(userId)}/${action}`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
    })
    const json = (await res.json()) as ApiResponse<boolean>
    return json.success && !!json.data
  } catch { return false }
}

export async function changeUserPlan(userId: string, plan: 'FREE' | 'PRO'): Promise<boolean> {
  try {
    const res = await authedFetch(`${API_BASE_URL}/api/v1/admin/users/${encodeURIComponent(userId)}/plan`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const json = (await res.json()) as ApiResponse<boolean>
    return json.success && !!json.data
  } catch { return false }
}
