import { useCallback, useEffect, useRef, useState } from 'react'
import { API_BASE_URL, fetchDailyFortune, fetchMoverReasons, fetchTopMovers, loadAllData } from '../api'
import { fetchAiPicks, fetchHiddenSignals } from '../api/ai'
import { fetchRecentDisclosures } from '../api/disclosures'
import { fetchUpcomingEvents } from '../api/events'
import { fetchMarketInsight } from '../api/insights'
import { fetchRecentMediaSummaries } from '../api/media'
import { fetchActiveMarketRound } from '../api/marketRounds'
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
  MarketRound,
  MarketSummaryData,
  MediaSummaryItem,
  MoverReason,
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
  const [moverReasons, setMoverReasons] = useState<MoverReason[]>([])
  const [mediaSummaries, setMediaSummaries] = useState<MediaSummaryItem[]>([])
  const [marketRound, setMarketRound] = useState<MarketRound | null>(null)
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

  // 최신 요청 번호 — 늦게 도착한 이전 응답이 새 데이터를 덮어쓰지 않게 (요청 레이스 가드).
  const requestSeq = useRef(0)
  // 한 번이라도 데이터를 받았는지 — 백그라운드 갱신 실패가 멀쩡한 화면을 전역 에러로 덮지 않게.
  const hasDataRef = useRef(false)

  const fetchData = useCallback(async () => {
    const seq = ++requestSeq.current
    const fresh = <T,>(setter: (v: T) => void) => (v: T) => {
      if (seq === requestSeq.current) setter(v)
    }
    setError('')
    try {
      const result = await loadAllData()
      if (seq !== requestSeq.current) return
      setApiHealth(result.health)
      setSummary(result.summary)
      setSections(result.sections)
      setAiRecommendation(result.aiRecommendation)
      setWatchlist(result.watchlist)
      setPortfolio(result.portfolio)
      setLastSyncedAt(formatSyncStamp(new Date()))
      hasDataRef.current = true
      if (authToken) {
        void fetchAlertHistory(authToken, 10).then(fresh(setAlertHistory)).catch(() => {})
        void fetchRecentDisclosures(authToken, 30).then(fresh(setDisclosures)).catch(() => {})
        void fetchHiddenSignals(authToken).then(fresh(setHiddenSignals)).catch(() => {})
      }
      void fetchAiPicks().then(fresh(setAiPicks)).catch(() => {})
      void fetchDailyFortune().then(fresh(setFortune)).catch(() => {})
      void fetchTopMovers(10).then(fresh(setTopMovers)).catch(() => {})
      void fetchMoverReasons().then(fresh(setMoverReasons)).catch(() => {})
      void fetchRecentMediaSummaries(6).then(fresh(setMediaSummaries)).catch(() => {})
      void fetchActiveMarketRound().then(fresh(setMarketRound)).catch(() => {})
      void fetchMarketInsight().then(fresh(setMarketInsight)).catch(() => {})
      void fetchUpcomingEvents(14).then(fresh(setUpcomingEvents)).catch(() => {})
      void fetchSystemStatus().then(fresh(setSystemStatus)).catch(() => {})
    } catch {
      if (seq !== requestSeq.current) return
      // 초기 로드 실패만 전체 화면 에러 — 데이터가 이미 떠 있으면(저장 후 백그라운드
      // 재조회 실패 등) 화면을 유지하고 다음 갱신에 기대를 건다.
      if (!hasDataRef.current) {
        setApiHealth(null)
        setError(`서버에 연결할 수 없습니다.\n${API_BASE_URL}`)
      }
    }
  }, [authToken])

  useEffect(() => {
    if (!enabled) {
      // 로그아웃/계정 전환 — 직전 사용자의 워치리스트·포트폴리오·알림이
      // 다음 로그인 화면에 비치지 않게 전부 리셋 + 진행 중 응답 무효화.
      requestSeq.current++
      hasDataRef.current = false
      setSummary(null); setSections(null); setAiRecommendation(null)
      setWatchlist([]); setPortfolio(null); setAlertHistory([])
      setFortune(null); setTopMovers(null); setMoverReasons([])
      setMediaSummaries([]); setMarketRound(null); setMarketInsight(null); setUpcomingEvents([])
      setDisclosures([]); setAiPicks(null); setHiddenSignals(null)
      setApiHealth(null); setSystemStatus(null)
      setError(''); setLastSyncedAt('')
      return
    }
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
    moverReasons,
    mediaSummaries,
    marketRound,
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
    setAlertHistory,
  }
}
