/**
 * Trading League API client.
 * 백엔드: signal-desk-api /api/v1/league/*
 */
import { API_BASE_URL, authedFetch } from '../api'
import type {
  ApiResponse,
  League,
  LeagueCurrency,
  LeagueDetail,
  LeaguePosition,
  LeagueTrade,
  LeagueVisibility,
  LeaderboardEntry,
  MarketScope,
  TradeSide,
  TradingHours,
} from '../types'

const base = `${API_BASE_URL}/api/v1/league`

export async function fetchMyLeagues(): Promise<League[]> {
  const r = await authedFetch(`${base}/my`)
  const j = (await r.json()) as ApiResponse<League[]>
  return j.success ? j.data : []
}

export type CreateLeagueInput = {
  name: string
  marketScope: MarketScope
  currency: LeagueCurrency
  startingCapital: number
  startedAt: string                  // ISO-8601
  endsAt: string
  tradingHours?: TradingHours
  visibility?: LeagueVisibility
  hostNickname: string
  hostAvatarEmoji?: string
}

export async function createLeague(input: CreateLeagueInput): Promise<League> {
  const r = await authedFetch(base, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!r.ok) throw new Error('create-league-failed')
  const j = (await r.json()) as ApiResponse<League>
  return j.data
}

export async function openLeague(id: string): Promise<League> {
  const r = await authedFetch(`${base}/${id}/open`, { method: 'POST' })
  if (!r.ok) throw new Error('open-league-failed')
  const j = (await r.json()) as ApiResponse<League>
  return j.data
}

export async function joinLeague(joinCode: string, nickname: string, avatarEmoji = '🐱'): Promise<LeagueDetail> {
  const r = await authedFetch(`${base}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ joinCode, nickname, avatarEmoji }),
  })
  if (!r.ok) throw new Error('join-league-failed')
  const j = (await r.json()) as ApiResponse<LeagueDetail>
  return j.data
}

export async function leaveLeague(id: string): Promise<void> {
  await authedFetch(`${base}/${id}/leave`, { method: 'DELETE' })
}

export async function fetchLeagueDetail(id: string): Promise<LeagueDetail | null> {
  const r = await authedFetch(`${base}/${id}`)
  const j = (await r.json()) as ApiResponse<LeagueDetail | null>
  return j.success ? j.data : null
}

export async function fetchLeaderboard(leagueId: string): Promise<LeaderboardEntry[]> {
  const r = await authedFetch(`${base}/${leagueId}/leaderboard`)
  const j = (await r.json()) as ApiResponse<LeaderboardEntry[]>
  return j.success ? j.data : []
}

export type PlaceTradeInput = {
  market: 'KR' | 'US'
  ticker: string
  name?: string          // 종목명 — 백엔드 시세 API엔 이름이 없어 클라이언트가 전달
  side: TradeSide
  quantity: number
}

export async function placeTrade(leagueId: string, input: PlaceTradeInput): Promise<LeagueTrade> {
  const r = await authedFetch(`${base}/${leagueId}/trades`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!r.ok) {
    const text = await r.text()
    throw new Error(text || 'trade-failed')
  }
  const j = (await r.json()) as ApiResponse<LeagueTrade>
  return j.data
}

export async function fetchTradeFeed(leagueId: string, limit = 100): Promise<LeagueTrade[]> {
  const r = await authedFetch(`${base}/${leagueId}/trades?limit=${limit}`)
  const j = (await r.json()) as ApiResponse<LeagueTrade[]>
  return j.success ? j.data : []
}

export async function fetchMyPositions(leagueId: string): Promise<LeaguePosition[]> {
  const r = await authedFetch(`${base}/${leagueId}/trades/positions`)
  const j = (await r.json()) as ApiResponse<LeaguePosition[]>
  return j.success ? j.data : []
}
