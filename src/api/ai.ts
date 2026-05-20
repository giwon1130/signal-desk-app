import { API_BASE_URL } from '../api'
import type { AiPicksData, ApiResponse, HiddenSignalsData } from '../types'

/** 오늘의 AI 픽 — Gemini 종목 추천. 전 사용자 공통. */
export async function fetchAiPicks(): Promise<AiPicksData | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/ai/picks`, {
      headers: { Accept: 'application/json' },
    })
    const json = (await res.json()) as ApiResponse<AiPicksData | null>
    return json.success ? json.data ?? null : null
  } catch {
    return null
  }
}

/** 숨은 시그널 — 보유/관심 종목에 잡힌 공시·수급·급등락. 인증 필요. */
export async function fetchHiddenSignals(authToken: string): Promise<HiddenSignalsData | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/ai/signals`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${authToken}` },
    })
    const json = (await res.json()) as ApiResponse<HiddenSignalsData>
    return json.success ? json.data : null
  } catch {
    return null
  }
}
