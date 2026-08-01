import { API_BASE_URL, authedFetch } from '../api'
import type { ApiResponse } from '../types/system'
import type { TraderConnectionCreated, TraderConnectionStatus } from '../types/trader'

async function parseOrThrow<T>(response: Response): Promise<T> {
  const json = await response.json().catch(() => null) as ApiResponse<T> | { error?: string } | null
  if (!response.ok || !json || !('success' in json) || !json.success) {
    const message = json && 'error' in json ? json.error : null
    throw new Error(message || '개인 trader 연결을 처리하지 못했어요.')
  }
  return json.data
}

export async function getTraderConnection(): Promise<TraderConnectionStatus> {
  const response = await authedFetch(`${API_BASE_URL}/api/v1/me/trader-connection`)
  const data = await parseOrThrow<TraderConnectionStatus | null>(response)
  return data ?? { connected: false }
}

export async function createTraderConnection(): Promise<TraderConnectionCreated> {
  const response = await authedFetch(`${API_BASE_URL}/api/v1/me/trader-connection`, { method: 'POST' })
  return parseOrThrow<TraderConnectionCreated>(response)
}

export async function disconnectTrader(): Promise<void> {
  const response = await authedFetch(`${API_BASE_URL}/api/v1/me/trader-connection`, { method: 'DELETE' })
  await parseOrThrow<boolean>(response)
}
