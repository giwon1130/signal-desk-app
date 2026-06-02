import type {
  AiRecommendationData,
  ApiResponse,
  DailyFortune,
  HealthResponse,
  MarketSectionsData,
  MarketSummaryData,
  MoverReason,
  PortfolioResponse,
  StockSearchResult,
  TopMoversResponse,
  WatchItem,
  WatchlistResponse,
} from './types'
import { getMemoryToken } from './api/auth'
import { API_BASE_URL } from './api/config'

// 외부(다른 모듈)에서 `import { API_BASE_URL } from '../api'` 로 쓰던 것 호환 유지.
export { API_BASE_URL }

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

  // 핵심(health/summary/sections)만 치명적 — 실패 시 전체 에러 화면.
  // 나머지(ai/watchlist/portfolio)는 한 곳이 죽어도 빈값으로 강등해 앱이 멈추지 않게 한다.
  if (!healthResponse.ok || !summaryResponse.ok || !sectionsResponse.ok) {
    throw new Error('fetch failed')
  }

  const healthJson = (await healthResponse.json()) as HealthResponse
  const summaryJson = (await summaryResponse.json()) as ApiResponse<MarketSummaryData>
  const sectionsJson = (await sectionsResponse.json()) as ApiResponse<MarketSectionsData>

  const EMPTY_AI: AiRecommendationData = { generatedDate: '', summary: '', executionLogs: [], metrics: null }
  const EMPTY_PORTFOLIO: PortfolioResponse['portfolio'] = {
    totalCost: 0, totalValue: 0, totalProfit: 0, totalProfitRate: 0, positions: [],
  }
  const safe = async <T>(res: Response, pick: (j: any) => T, fallback: T): Promise<T> => {
    try { return res.ok ? pick(await res.json()) : fallback } catch { return fallback }
  }

  return {
    health: healthJson,
    summary: summaryJson.data,
    sections: sectionsJson.data,
    aiRecommendation: await safe(aiResponse, (j) => j.data.aiRecommendations as AiRecommendationData, EMPTY_AI),
    watchlist: await safe(watchlistResponse, (j) => j.data.watchlist as WatchItem[], []),
    portfolio: await safe(portfolioResponse, (j) => j.data.portfolio as PortfolioResponse['portfolio'], EMPTY_PORTFOLIO),
  }
}

export async function searchStocks(query: string, market: string): Promise<StockSearchResult[]> {
  const marketParam = market === 'ALL' ? '' : `&market=${market}`
  const response = await authedFetch(
    `${API_BASE_URL}/api/v1/market/stocks/search?q=${encodeURIComponent(query)}${marketParam}&limit=20`,
  )
  if (!response.ok) {
    throw new Error((await response.text()) || 'stock-search-failed')
  }
  const result = (await response.json()) as ApiResponse<StockSearchResult[]>
  return result.data
}

export async function deleteFavoriteItem(id: string): Promise<void> {
  const response = await authedFetch(`${API_BASE_URL}/api/v1/workspace/watchlist/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error((await response.text()) || 'delete-favorite-failed')
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
  targetPrice?: number | null
  stopLossPrice?: number | null
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
      targetPrice: payload.targetPrice ?? null,
      stopLossPrice: payload.stopLossPrice ?? null,
    }),
  })
  if (!response.ok) {
    throw new Error((await response.text()) || 'save-portfolio-failed')
  }
}

export async function deletePortfolioPosition(id: string): Promise<void> {
  const response = await authedFetch(`${API_BASE_URL}/api/v1/workspace/portfolio/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error((await response.text()) || 'delete-portfolio-failed')
  }
}

/** 급등/급락 상위 종목 (KR KOSPI·KOSDAQ) */
export async function fetchTopMovers(limit = 10): Promise<TopMoversResponse | null> {
  try {
    const response = await authedFetch(`${API_BASE_URL}/api/v1/market/top-movers?limit=${limit}`)
    if (!response.ok) return null
    const json = (await response.json()) as ApiResponse<TopMoversResponse>
    return json.data
  } catch {
    return null
  }
}

/** 급등/급락 사유 — "왜 올랐나/내렸나". 실패 시 빈 배열. */
export async function fetchMoverReasons(): Promise<MoverReason[]> {
  try {
    const response = await authedFetch(`${API_BASE_URL}/api/v1/market/top-movers/reasons`)
    if (!response.ok) return []
    const json = (await response.json()) as ApiResponse<MoverReason[] | null>
    return json.data ?? []
  } catch {
    return []
  }
}

/** 오늘의 투자 운세 (userId + 날짜 시드) */
export async function fetchDailyFortune(): Promise<DailyFortune | null> {
  try {
    const response = await authedFetch(`${API_BASE_URL}/api/v1/workspace/fortune`)
    if (!response.ok) return null
    const json = (await response.json()) as ApiResponse<DailyFortune>
    return json.data
  } catch {
    return null
  }
}

// 한 탭으로 관심종목에 추가하는 단순 버전 (stance/note 자동 채움)
export async function saveWatchItemAlerts(item: {
  id: string
  market: string
  ticker: string
  name: string
  price: number
  changeRate: number
  sector: string
  stance: string
  note: string
  alertBelow: number | null
  alertAbove: number | null
  volumeAlert: boolean
}): Promise<void> {
  const response = await authedFetch(`${API_BASE_URL}/api/v1/workspace/watchlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  })
  if (!response.ok) throw new Error((await response.text()) || 'save-watch-alerts-failed')
}

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
      // AI 픽 등 일부 호출지점은 sector 정보가 없어 빈 문자열을 보냄 — 백엔드의 @NotBlank
      // 거절을 피하려 빈 값이면 fallback 문구로 채운다.
      sector: stock.sector || 'AI 추천',
      stance: stock.stance || '관찰',
      note: '관심종목',
    }),
  })
  if (!response.ok) {
    throw new Error((await response.text()) || 'quick-add-watch-failed')
  }
}
