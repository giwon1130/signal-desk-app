/**
 * Trading League — 친구 모의투자.
 * spec: docs/mock-investment-game-spec.md
 */

export type LeagueStatus = 'DRAFT' | 'OPEN' | 'RUNNING' | 'FINISHED'
export type MarketScope = 'KR' | 'US' | 'BOTH'
export type LeagueCurrency = 'KRW' | 'USD'
export type TradingHours = 'MARKET_HOURS_ONLY' | 'ALWAYS'
export type LeagueVisibility = 'OPEN' | 'CLOSED'
export type TradeSide = 'BUY' | 'SELL'

export type League = {
  id: string
  name: string
  hostUserId: string
  joinCode: string
  marketScope: MarketScope
  currency: LeagueCurrency
  startingCapital: number
  startedAt: string
  endsAt: string
  status: LeagueStatus
  tradingHours: TradingHours
  visibility: LeagueVisibility
  createdAt: string
}

export type LeagueParticipant = {
  userId: string
  nickname: string
  avatarEmoji: string
  cashBalance: number
  joinedAt: string
  finalReturnRate: number | null
  finalRank: number | null
}

export type LeagueDetail = {
  league: League
  participants: LeagueParticipant[]
}

export type LeagueTrade = {
  id: string
  leagueId: string
  userId: string
  market: string
  ticker: string
  name: string
  side: TradeSide
  quantity: number
  originalPrice: number
  originalCurrency: LeagueCurrency
  price: number
  exchangeRate: number
  feeAmount: number
  notionalAmount: number
  executedAt: string
}

export type LeaguePosition = {
  market: string
  ticker: string
  name: string
  quantity: number
  averageCost: number
  realizedPnl: number
}

export type LeaderboardEntry = {
  userId: string
  nickname: string
  avatarEmoji: string
  cashBalance: number
  evaluatedAssets: number
  totalAssets: number
  returnRate: number
  rank: number
  positionCount: number
}
