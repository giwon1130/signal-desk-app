/**
 * 리딩(Leading Call) API client.
 * 백엔드: signal-desk-api /api/v1/reading/*
 */
import { API_BASE_URL, authedFetch } from '../api'
import type {
  AiFlowReading,
  ApiResponse,
  CallInput,
  DetectedMention,
  Leader,
  LeaderProfile,
  PostVisibility,
  ReadingPost,
} from '../types'

const base = `${API_BASE_URL}/api/v1/reading`

/** 🤖 AI 시황 흐름 리딩 — 최신순. 실패 시 빈 배열(throw 안 함). */
export async function fetchAiFlowReadings(limit = 20): Promise<AiFlowReading[]> {
  try {
    const r = await authedFetch(`${base}/ai-flow?limit=${limit}`, { headers: { Accept: 'application/json' } })
    const j = (await r.json()) as ApiResponse<AiFlowReading[]>
    return j.success ? (j.data ?? []) : []
  } catch {
    return []
  }
}

// ─── 리더 ──────────────────────────────────────────────────────────────────
export async function applyForLeader(displayName: string, bio = ''): Promise<Leader> {
  const r = await authedFetch(`${base}/leader/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName, bio }),
  })
  if (!r.ok) throw new Error((await r.text()) || 'apply-leader-failed')
  const j = (await r.json()) as ApiResponse<Leader>
  return j.data
}

/** 리더 자격 — 권한 있는 계정만 '리더 되기' 노출. 미지원/실패 시 false(안전). */
export async function fetchLeaderEligibility(): Promise<boolean> {
  try {
    const r = await authedFetch(`${base}/eligibility`)
    if (!r.ok) return false
    const j = (await r.json()) as ApiResponse<{ canLead: boolean }>
    return j.success ? !!j.data?.canLead : false
  } catch {
    return false
  }
}

export async function fetchMyLeader(): Promise<Leader | null> {
  const r = await authedFetch(`${base}/leader/me`)
  const j = (await r.json()) as ApiResponse<Leader | null>
  return j.success ? j.data : null
}

export async function fetchLeaderProfile(leaderUserId: string): Promise<LeaderProfile | null> {
  const r = await authedFetch(`${base}/leader/${leaderUserId}/profile`)
  const j = (await r.json()) as ApiResponse<LeaderProfile | null>
  return j.success ? j.data : null
}

// ─── 구독 ──────────────────────────────────────────────────────────────────
export async function subscribe(inviteCode: string): Promise<Leader> {
  const r = await authedFetch(`${base}/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inviteCode }),
  })
  if (!r.ok) {
    const text = await r.text()
    throw new Error(text || 'subscribe-failed')
  }
  const j = (await r.json()) as ApiResponse<Leader>
  return j.data
}

export async function unsubscribe(leaderUserId: string): Promise<void> {
  const r = await authedFetch(`${base}/subscribe/${leaderUserId}`, { method: 'DELETE' })
  if (!r.ok) throw new Error((await r.text()) || 'unsubscribe-failed')
}

/** 둘러보기에서 코드 없이 userId 로 구독. */
export async function subscribeByLeaderId(leaderUserId: string): Promise<void> {
  const r = await authedFetch(`${base}/subscribe/${leaderUserId}`, { method: 'POST' })
  if (!r.ok) throw new Error((await r.text()) || 'subscribe-failed')
}

export type LeaderCard = {
  userId: string
  displayName: string
  bio: string
  followerCount: number
  totalCalls: number
  hitRate: number
  avgReturnPct: number | null
  following: boolean
}

/** 리딩 둘러보기 — 승인된 리더 목록(적중률·구독자 순). */
export async function fetchDiscoverLeaders(): Promise<LeaderCard[]> {
  try {
    const r = await authedFetch(`${base}/leaders`)
    const j = (await r.json()) as ApiResponse<LeaderCard[]>
    return j.success ? j.data ?? [] : []
  } catch { return [] }
}

export async function fetchFollowing(): Promise<Leader[]> {
  const r = await authedFetch(`${base}/following`)
  const j = (await r.json()) as ApiResponse<Leader[]>
  return j.success ? j.data : []
}

// ─── 종목 자동 인식 ──────────────────────────────────────────────────────────
export async function detectMentions(body: string): Promise<DetectedMention[]> {
  const r = await authedFetch(`${base}/detect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  })
  const j = (await r.json()) as ApiResponse<DetectedMention[]>
  return j.success ? j.data : []
}

// ─── 글 게시 / 피드 ──────────────────────────────────────────────────────────
export type PublishPostInput = {
  title: string
  body: string
  visibility: PostVisibility
  calls: CallInput[]
}

export async function publishPost(input: PublishPostInput): Promise<ReadingPost> {
  const r = await authedFetch(`${base}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!r.ok) {
    const text = await r.text()
    throw new Error(text || 'publish-post-failed')
  }
  const j = (await r.json()) as ApiResponse<ReadingPost>
  return j.data
}

export async function fetchFeed(limit = 50): Promise<ReadingPost[]> {
  const r = await authedFetch(`${base}/feed?limit=${limit}`)
  const j = (await r.json()) as ApiResponse<ReadingPost[]>
  return j.success ? j.data : []
}
