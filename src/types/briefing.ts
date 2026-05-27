/**
 * 일일 브리핑 타입 — HomeTab hero 카드의 시간대별 행동 가이드.
 */

export type BriefingSlot = 'PRE_MARKET' | 'INTRADAY' | 'POST_MARKET' | 'WEEKEND' | 'HOLIDAY'

export type BriefingContext = {
  holdingPnlLabel: string | null
  holdingPnlRate: number | null
  watchlistAlertCount: number
  marketMood: string
  keyEvent: string | null
}

export type BriefingAction = {
  priority: 'high' | 'medium' | 'low'
  category: string
  title: string
  detail: string
  ticker: string | null
  market: string | null
}

export type DailyBriefing = {
  headline: string
  preMarket: string[]
  afterMarket: string[]
  narrative: string
  slot: BriefingSlot
  context: BriefingContext | null
  actionItems: BriefingAction[]
}
