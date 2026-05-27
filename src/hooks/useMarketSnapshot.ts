import { useCallback, useEffect, useState } from 'react'
import { API_BASE_URL, fetchDailyFortune, fetchTopMovers, loadAllData } from '../api'
import { fetchAiPicks, fetchHiddenSignals } from '../api/ai'
import { fetchRecentDisclosures } from '../api/disclosures'
import { fetchUpcomingEvents } from '../api/events'
import { fetchMarketInsight } from '../api/insights'
import { fetchLatestMediaSummary } from '../api/media'
import { fetchAlertHistory } from '../api/pushDevice'
import { fetchSystemStatus, type SystemStatus } from '../api/system'
import { formatSyncStamp } from '../utils'
import { hapticLight } from '../utils/haptics'
import type {
  AiPicksData,
  AiRecommendationData,
  AlertHistoryItem,
  DailyFortune,
  DisclosureItem,
  HealthResponse,
  HiddenSignalsData,
  MarketEvent,
  MarketInsightData,
  MarketSectionsData,
  MarketSummaryData,
  MediaSummaryItem,
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
  const [mediaSummary, setMediaSummary] = useState<MediaSummaryItem | null>(null)
  const [marketInsight, setMarketInsight] = useState<MarketInsightData | null>(null)
  const [upcomingEvents, setUpcomingEvents] = useState<MarketEvent[]>([])
  const [disclosures, setDisclosures] = useState<DisclosureItem[]>([])
  const [aiPicks, setAiPicks] = useState<AiPicksData | null>(null)
  const [hiddenSignals, setHiddenSignals] = useState<HiddenSignalsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [apiHealth, setApiHealth] = useState<HealthResponse | null>(null)
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
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
        void fetchRecentDisclosures(authToken, 30).then(setDisclosures)
        void fetchHiddenSignals(authToken).then(setHiddenSignals)
      }
      void fetchAiPicks().then(setAiPicks)
      void fetchDailyFortune().then(setFortune)
      void fetchTopMovers(10).then(setTopMovers)
      void fetchLatestMediaSummary().then(setMediaSummary)
      void fetchMarketInsight().then(setMarketInsight)
      void fetchUpcomingEvents(14).then(setUpcomingEvents)
      void fetchSystemStatus().then(setSystemStatus)
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
    mediaSummary,
    marketInsight,
    upcomingEvents,
    disclosures,
    aiPicks,
    hiddenSignals,
    alertHistory,
    apiHealth,
    systemStatus,
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
