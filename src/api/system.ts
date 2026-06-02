/**
 * 시스템 헬스 — 외부 의존성 (Gemini 등) 일시 장애 안내용.
 * 인증 없이 fetch.
 */
import { API_BASE_URL } from '../api'
import type { ApiResponse } from '../types'

export type GeminiHealth = {
  healthy: boolean
  lastFailureAt: string | null
}

export type SystemStatus = {
  gemini: GeminiHealth
}

export async function fetchSystemStatus(): Promise<SystemStatus | null> {
  try {
    const r = await fetch(`${API_BASE_URL}/api/v1/system/status`, {
      headers: { Accept: 'application/json' },
    })
    const j = (await r.json()) as ApiResponse<SystemStatus>
    return j.success ? j.data : null
  } catch {
    return null
  }
}
