/**
 * 리딩(Leading Call) API client.
 * 백엔드: signal-desk-api /api/v1/reading/*
 */
import { API_BASE_URL, authedFetch } from '../api'
import type {
  ApiResponse,
  CallInput,
  DetectedMention,
  Leader,
  LeaderProfile,
  PostVisibility,
  ReadingPost,
} from '../types'

const base = `${API_BASE_URL}/api/v1/reading`

// ─── 리더 ──────────────────────────────────────────────────────────────────
export async function applyForLeader(displayName: string, bio = ''): Promise<Leader> {
  const r = await authedFetch(`${base}/leader/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName, bio }),
  })
  if (!r.ok) throw new Error('apply-leader-failed')
  const j = (await r.json()) as ApiResponse<Leader>
  return j.data
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
  await authedFetch(`${base}/subscribe/${leaderUserId}`, { method: 'DELETE' })
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
