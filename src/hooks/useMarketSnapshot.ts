import { useCallback, useEffect, useState } from 'react'
import { API_BASE_URL, fetchDailyFortune, fetchTopMovers, loadAllData } from '../api'
import { fetchAlertHistory } from '../api/pushDevice'
import { formatSyncStamp } from '../utils'
import { hapticLight } from '../utils/haptics'
import type {
  AiRecommendationData,
  AlertHistoryItem,
  DailyFortune,
  HealthResponse,
  MarketSectionsData,
  MarketSummaryData,
  PortfolioSummary,
  TopMoversResponse,
  WatchItem,
} from '../types'

export function useMarketSnapshot(authToken: string | null, enabled: boolean) {
  const [summary, setSummary] = useState<MarketSummaryData | null>(null)
  const [sections, setSections] = useState<MarketSectionsData | null>(null)
  const [aiRecommendation, setAiRecommendation] = useState<AiRecommendationData | null>(null)
  const [watchlist, setWatchlist] = useState<WatchItem[]>([])
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null)
  const [alertHistory, setAlertHistory] = useState<AlertHistoryItem[]>([])
  const [fortune, setFortune] = useState<DailyFortune | null>(null)
  const [topMovers, setTopMovers] = useState<TopMoversResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [apiHealth, setApiHealth] = useState<HealthResponse | null>(null)
  const [lastSyncedAt, setLastSyncedAt] = useState('')

  const fetchData = useCallback(async () => {
    setError('')
    try {
      const result = await loadAllData()
      setApiHealth(result.health)
      setSummary(result.summary)
      setSections(result.sections)
      setAiRecommendation(result.aiRecommendation)
      setWatchlist(result.watchlist)
      setPortfolio(result.portfolio)
      setLastSyncedAt(formatSyncStamp(new Date()))
      if (authToken) {
        void fetchAlertHistory(authToken, 10).then(setAlertHistory)
      }
      void fetchDailyFortune().then(setFortune)
      void fetchTopMovers(10).then(setTopMovers)
    } catch {
      setApiHealth(null)
      setError(`서버에 연결할 수 없어요.\n${API_BASE_URL}`)
    }
  }, [authToken])

  useEffect(() => {
    if (!enabled) return
    setLoading(true)
    void fetchData().finally(() => setLoading(false))
  }, [fetchData, enabled])

  const refresh = useCallback(async () => {
    setRefreshing(true)
    void hapticLight()
    await fetchData()
    setRefreshing(false)
  }, [fetchData])

  return {
    summary,
    sections,
    aiRecommendation,
    watchlist,
    portfolio,
    fortune,
    topMovers,
    alertHistory,
    apiHealth,
    lastSyncedAt,
    loading,
    refreshing,
    error,
    refresh,
    fetchData,
    setLoading,
    setWatchlist,
    setPortfolio,
  }
}
