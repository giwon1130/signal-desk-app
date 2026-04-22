import type {
  AiRecommendationData,
  ApiResponse,
  FavoriteDraft,
  HealthResponse,
  MarketSectionsData,
  MarketSummaryData,
  PortfolioResponse,
  StockSearchResult,
  WatchItem,
  WatchlistResponse,
} from './types'
import { getMemoryToken } from './api/auth'

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://signal-desk-api-production.up.railway.app'

/** JWT 토큰이 있으면 Authorization 헤더를 자동 주입한 fetch */
export function authedFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = getMemoryToken()
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
  }
  if (token) headers.Authorization = `Bearer ${token}`
  return fetch(input, { ...init, headers })
}

export type LoadAllDataResult = {
  health: HealthResponse
  summary: MarketSummaryData
  sections: MarketSectionsData
  aiRecommendation: AiRecommendationData
  watchlist: WatchItem[]
  portfolio: PortfolioResponse['portfolio']
}

export async function loadAllData(): Promise<LoadAllDataResult> {
  const [healthResponse, summaryResponse, sectionsResponse, aiResponse, watchlistResponse, portfolioResponse] =
    await Promise.all([
      authedFetch(`${API_BASE_URL}/health`),
      authedFetch(`${API_BASE_URL}/api/v1/market/summary`),
      authedFetch(`${API_BASE_URL}/api/v1/market/sections`),
      authedFetch(`${API_BASE_URL}/api/v1/market/ai-recommendations`),
      authedFetch(`${API_BASE_URL}/api/v1/market/watchlist`),
      authedFetch(`${API_BASE_URL}/api/v1/market/portfolio`),
    ])

  if (
    !healthResponse.ok ||
    !summaryResponse.ok ||
    !sectionsResponse.ok ||
    !aiResponse.ok ||
    !watchlistResponse.ok ||
    !portfolioResponse.ok
  ) {
    throw new Error('fetch failed')
  }

  const healthJson = (await healthResponse.json()) as HealthResponse
  const summaryJson = (await summaryResponse.json()) as ApiResponse<MarketSummaryData>
  const sectionsJson = (await sectionsResponse.json()) as ApiResponse<MarketSectionsData>
  const aiJson = (await aiResponse.json()) as ApiResponse<{ aiRecommendations: AiRecommendationData }>
  const watchlistJson = (await watchlistResponse.json()) as ApiResponse<WatchlistResponse>
  const portfolioJson = (await portfolioResponse.json()) as ApiResponse<PortfolioResponse>

  return {
    health: healthJson,
    summary: summaryJson.data,
    sections: sectionsJson.data,
    aiRecommendation: aiJson.data.aiRecommendations,
    watchlist: watchlistJson.data.watchlist,
    portfolio: portfolioJson.data.portfolio,
  }
}

export async function searchStocks(query: string, market: string): Promise<StockSearchResult[]> {
  const marketParam = market === 'ALL' ? '' : `&market=${market}`
  const response = await authedFetch(
    `${API_BASE_URL}/api/v1/market/stocks/search?q=${encodeURIComponent(query)}${marketParam}&limit=20`,
  )
  if (!response.ok) {
    throw new Error('stock-search-failed')
  }
  const result = (await response.json()) as ApiResponse<StockSearchResult[]>
  return result.data
}

export async function saveFavoriteItem(
  selectedStock: {
    watchItem?: { id: string }
    base: { market: string; ticker: string; name: string; price: number; changeRate: number; sector: string; stance: string }
  },
  draft: FavoriteDraft,
): Promise<void> {
  const response = await authedFetch(`${API_BASE_URL}/api/v1/workspace/watchlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: selectedStock.watchItem?.id ?? '',
      market: selectedStock.base.market,
      ticker: selectedStock.base.ticker,
      name: selectedStock.base.name,
      price: Math.round(selectedStock.base.price),
      changeRate: selectedStock.base.changeRate,
      sector: selectedStock.base.sector,
      stance: draft.stance.trim() || selectedStock.base.stance,
      note: draft.note.trim() || '앱 즐겨찾기',
    }),
  })
  if (!response.ok) {
    throw new Error('save-favorite-failed')
  }
}

export async function deleteFavoriteItem(id: string): Promise<void> {
  const response = await authedFetch(`${API_BASE_URL}/api/v1/workspace/watchlist/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error('delete-favorite-failed')
  }
}

export async function savePortfolioPosition(payload: {
  id?: string
  market: string
  ticker: string
  name: string
  buyPrice: number
  currentPrice: number
  quantity: number
}): Promise<void> {
  const response = await authedFetch(`${API_BASE_URL}/api/v1/workspace/portfolio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: payload.id ?? '',
      market: payload.market,
      ticker: payload.ticker,
      name: payload.name,
      buyPrice: Math.round(payload.buyPrice),
      currentPrice: Math.round(payload.currentPrice),
      quantity: Math.max(1, Math.round(payload.quantity)),
    }),
  })
  if (!response.ok) {
    throw new Error('save-portfolio-failed')
  }
}

export async function deletePortfolioPosition(id: string): Promise<void> {
  const response = await authedFetch(`${API_BASE_URL}/api/v1/workspace/portfolio/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error('delete-portfolio-failed')
  }
}

// 한 탭으로 관심종목에 추가하는 단순 버전 (stance/note 자동 채움)
export async function quickAddWatchItem(stock: {
  market: string
  ticker: string
  name: string
  price: number
  changeRate: number
  sector: string
  stance: string
}): Promise<void> {
  const response = await authedFetch(`${API_BASE_URL}/api/v1/workspace/watchlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: '',
      market: stock.market,
      ticker: stock.ticker,
      name: stock.name,
      price: Math.round(stock.price),
      changeRate: stock.changeRate,
      sector: stock.sector,
      stance: stock.stance || '관찰',
      note: '관심종목',
    }),
  })
  if (!response.ok) {
    throw new Error('quick-add-watch-failed')
  }
}
