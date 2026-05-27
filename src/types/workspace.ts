/**
 * 워크스페이스 타입 — watchlist / portfolio / 종목 검색·상세.
 */
import type { RecommendationExecutionLog } from './ai'

export type TechnicalSignal = {
  rsi: number | null
  rsiState: string | null
  ma5: number | null
  ma20: number | null
  maSignal: string | null
  week52High: number | null
  week52Low: number | null
  week52State: string | null
}

export type WatchItem = {
  id: string
  market: string
  ticker: string
  name: string
  price: number
  changeRate: number
  sector: string
  stance: string
  note: string
  source: string
  technical?: TechnicalSignal | null
  volume?: number
  volumeRatio?: number | null
  alertBelow?: number | null
  alertAbove?: number | null
  volumeAlert?: boolean
}

export type HoldingPosition = {
  id: string
  market: string
  ticker: string
  name: string
  buyPrice: number
  currentPrice: number
  quantity: number
  profitAmount: number
  evaluationAmount: number
  profitRate: number
  source: string
  targetPrice?: number | null
  stopLossPrice?: number | null
}

export type PortfolioSummary = {
  totalCost: number
  totalValue: number
  totalProfit: number
  totalProfitRate: number
  positions: HoldingPosition[]
}

export type WatchlistResponse = {
  generatedAt: string
  watchlist: WatchItem[]
}

export type PortfolioResponse = {
  generatedAt: string
  portfolio: PortfolioSummary
}

export type StockSearchResult = {
  ticker: string
  name: string
  market: string
  sector: string
  price: number
  changeRate: number
  stance: string
}

export type SelectedStockSnapshot = {
  base: StockSearchResult
  watchItem?: WatchItem
  portfolioPosition?: HoldingPosition
  latestAiLog?: RecommendationExecutionLog
}

export type FavoriteDraft = {
  stance: string
  note: string
}
