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

/** AI 시황 흐름 리딩 — "🤖 AI 시황" 룸 카드 (서버 /reading/ai-flow). */
export type AiFlowReading = {
  id: string
  title: string            // "6월 15일 마감 시황 흐름" 또는 영상 제목
  headline: string         // AI 한 줄
  narrative: string        // 본문
  flowPoints: string[]     // 주도/순환매/전망/체크포인트 불릿
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
  keyTickers: string[]
  sourceLabel: string      // "시데 AI 시황" 또는 "삼프로TV"
  sourceUrl: string        // 유튜브 원문 링크(데이터 기반은 빈 문자열)
  generatedAt: string
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
