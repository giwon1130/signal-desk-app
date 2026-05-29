/**
 * 리딩(Leading Call) — 종목 콜 + 시황 공유.
 * spec: docs/leading-call-spec.md
 */

export type LeaderStatus = 'PENDING' | 'APPROVED' | 'SUSPENDED'
export type PostVisibility = 'FOLLOWERS' | 'PUBLIC'
export type CallStatus = 'ACTIVE' | 'HIT' | 'CLOSED'
export type CallCurrency = 'KRW' | 'USD'
export type ReadingMarket = 'KR' | 'US'

export type Leader = {
  userId: string
  displayName: string
  bio: string
  inviteCode: string | null   // 본인/구독 화면에서만
  status: LeaderStatus
  followerCount: number
}

export type DetectedMention = {
  ticker: string
  name: string
  market: ReadingMarket
  matchedText: string
  confidence: 'HIGH' | 'MEDIUM'
}

export type ReadingCall = {
  id: string
  market: ReadingMarket
  ticker: string
  name: string
  entryPrice: number
  entryCurrency: CallCurrency
  targetReturnPct: number | null
  status: CallStatus
  currentPrice: number | null
  returnPct: number | null
  entryLockedAt: string
}

export type ReadingPost = {
  id: string
  leaderUserId: string
  leaderName: string
  title: string
  body: string
  visibility: PostVisibility
  createdAt: string
  calls: ReadingCall[]
}

export type LeaderStats = {
  totalCalls: number
  hitCount: number
  hitRate: number          // 0~1
  avgReturnPct: number | null
}

export type LeaderProfile = {
  leader: Leader
  stats: LeaderStats
  posts: ReadingPost[]
}

/** 글 작성 시 확정한 콜 입력. */
export type CallInput = {
  market: ReadingMarket
  ticker: string
  name: string
  targetReturnPct: number | null
}
