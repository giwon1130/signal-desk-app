import { StatusBar } from 'expo-status-bar'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { API_BASE_URL, deleteFavoriteItem, loadAllData, saveFavoriteItem, searchStocks } from './src/api'
import { styles } from './src/styles'
import { AITab } from './src/tabs/AITab'
import { HomeTab } from './src/tabs/HomeTab'
import { MarketTab } from './src/tabs/MarketTab'
import { StocksTab } from './src/tabs/StocksTab'
import type {
  AiRecommendationData,
  FavoriteDraft,
  HealthResponse,
  HoldingPosition,
  LogFilter,
  MarketKey,
  MarketSectionsData,
  MarketSummaryData,
  PeriodKey,
  PortfolioSummary,
  SelectedStockSnapshot,
  StockMarketFilter,
  StockSearchResult,
  TabKey,
  WatchItem,
} from './src/types'
import { normalizeText } from './src/utils'

export default function App() {
  const { width } = useWindowDimensions()

  const [activeTab, setActiveTab] = useState<TabKey>('home')
  const [summary, setSummary] = useState<MarketSummaryData | null>(null)
  const [sections, setSections] = useState<MarketSectionsData | null>(null)
  const [aiRecommendation, setAiRecommendation] = useState<AiRecommendationData | null>(null)
  const [watchlist, setWatchlist] = useState<WatchItem[]>([])
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [apiHealth, setApiHealth] = useState<HealthResponse | null>(null)
  const [lastSyncedAt, setLastSyncedAt] = useState('')
  const [homeQuery, setHomeQuery] = useState('')
  const [logQuery, setLogQuery] = useState('')
  const [logFilter, setLogFilter] = useState<LogFilter>('ALL')
  const [chartMarket, setChartMarket] = useState<MarketKey>('KR')
  const [chartPeriod, setChartPeriod] = useState<PeriodKey>('1D')
  const [selectedIndexLabel, setSelectedIndexLabel] = useState('')
  const [stockSearch, setStockSearch] = useState('')
  const [stockMarketFilter, setStockMarketFilter] = useState<StockMarketFilter>('ALL')
  const [stockResults, setStockResults] = useState<StockSearchResult[]>([])
  const [stockSearchLoading, setStockSearchLoading] = useState(false)
  const [selectedStockKey, setSelectedStockKey] = useState('')
  const [favoriteDraft, setFavoriteDraft] = useState<FavoriteDraft>({ stance: '', note: '' })
  const [favoriteSaving, setFavoriteSaving] = useState(false)
  const [favoriteDeletingId, setFavoriteDeletingId] = useState('')

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
      setLastSyncedAt(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }))
    } catch {
      setApiHealth(null)
      setError(`API 연결 실패: ${API_BASE_URL}`)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    void fetchData().finally(() => setLoading(false))
  }, [fetchData])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }, [fetchData])

  const filteredLogs = useMemo(() => {
    const logs = aiRecommendation?.executionLogs ?? []
    const stageFiltered = logFilter === 'ALL' ? logs : logs.filter((item) => item.stage === logFilter)
    const query = normalizeText(logQuery)
    if (!query) return stageFiltered.slice(0, 20)
    return stageFiltered
      .filter((item) =>
        [item.name, item.ticker, item.market, item.status, item.rationale].some((value) =>
          normalizeText(value).includes(query),
        ),
      )
      .slice(0, 20)
  }, [aiRecommendation?.executionLogs, logFilter, logQuery])

  const successRate = useMemo(() => {
    const resultLogs = (aiRecommendation?.executionLogs ?? []).filter((item) => item.realizedReturnRate != null)
    if (!resultLogs.length) return '-'
    const successCount = resultLogs.filter((item) => (item.realizedReturnRate ?? 0) >= 0).length
    return `${Math.round((successCount / resultLogs.length) * 100)}%`
  }, [aiRecommendation?.executionLogs])

  const filteredWatchlist = useMemo(() => {
    const query = normalizeText(homeQuery)
    if (!query) return watchlist
    return watchlist.filter((item) =>
      [item.name, item.ticker, item.market, item.sector, item.stance].some((value) =>
        normalizeText(value).includes(query),
      ),
    )
  }, [homeQuery, watchlist])

  const filteredPortfolioPositions = useMemo<HoldingPosition[]>(() => {
    const positions = portfolio?.positions ?? []
    const query = normalizeText(homeQuery)
    if (!query) return positions
    return positions.filter((item) =>
      [item.name, item.ticker, item.market].some((value) => normalizeText(value).includes(query)),
    )
  }, [homeQuery, portfolio?.positions])

  const topWatchlist = useMemo(() => filteredWatchlist.slice(0, 4), [filteredWatchlist])
  const topPortfolioPositions = useMemo(() => filteredPortfolioPositions.slice(0, 4), [filteredPortfolioPositions])
  const recommendLogs = useMemo(
    () => (aiRecommendation?.executionLogs ?? []).filter((item) => item.stage === 'RECOMMEND').length,
    [aiRecommendation?.executionLogs],
  )
  const resultLogs = useMemo(
    () => (aiRecommendation?.executionLogs ?? []).filter((item) => item.stage === 'RESULT').length,
    [aiRecommendation?.executionLogs],
  )

  const activeSection = useMemo(() => {
    if (!sections) return null
    return chartMarket === 'KR' ? sections.koreaMarket : sections.usMarket
  }, [sections, chartMarket])

  useEffect(() => {
    if (!activeSection?.indices.length) return
    if (activeSection.indices.some((item) => item.label === selectedIndexLabel)) return
    setSelectedIndexLabel(activeSection.indices[0].label)
  }, [activeSection, selectedIndexLabel])

  const activeIndex = useMemo(() => {
    if (!activeSection) return null
    return activeSection.indices.find((item) => item.label === selectedIndexLabel) ?? activeSection.indices[0] ?? null
  }, [activeSection, selectedIndexLabel])

  const activePeriod = useMemo(() => {
    if (!activeIndex) return null
    return activeIndex.periods.find((item) => item.key === chartPeriod) ?? activeIndex.periods[0] ?? null
  }, [activeIndex, chartPeriod])

  useEffect(() => {
    let cancelled = false
    const timeoutId = setTimeout(() => {
      setStockSearchLoading(true)
      searchStocks(stockSearch, stockMarketFilter)
        .then((results) => { if (!cancelled) setStockResults(results) })
        .catch(() => { if (!cancelled) setStockResults([]) })
        .finally(() => { if (!cancelled) setStockSearchLoading(false) })
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [stockSearch, stockMarketFilter])

  useEffect(() => {
    if (!stockResults.length) {
      setSelectedStockKey('')
      return
    }
    if (stockResults.some((item) => `${item.market}:${item.ticker}` === selectedStockKey)) return
    setSelectedStockKey(`${stockResults[0].market}:${stockResults[0].ticker}`)
  }, [selectedStockKey, stockResults])

  const selectedStock = useMemo<SelectedStockSnapshot | null>(() => {
    const [market, ticker] = selectedStockKey.split(':')
    if (!market || !ticker) return null
    const base = stockResults.find((item) => item.market === market && item.ticker === ticker)
    if (!base) return null
    return {
      base,
      watchItem: watchlist.find((item) => item.market === market && item.ticker === ticker),
      portfolioPosition: portfolio?.positions.find((item) => item.market === market && item.ticker === ticker),
      latestAiLog: (aiRecommendation?.executionLogs ?? []).find(
        (item) => item.market === market && item.ticker === ticker,
      ),
    }
  }, [aiRecommendation?.executionLogs, portfolio?.positions, selectedStockKey, stockResults, watchlist])

  useEffect(() => {
    if (!selectedStock) {
      setFavoriteDraft({ stance: '', note: '' })
      return
    }
    setFavoriteDraft({
      stance: selectedStock.watchItem?.stance ?? selectedStock.base.stance,
      note: selectedStock.watchItem?.note ?? '앱 즐겨찾기',
    })
  }, [selectedStock])

  const handleSaveFavorite = useCallback(async () => {
    if (!selectedStock) return
    setFavoriteSaving(true)
    try {
      await saveFavoriteItem(selectedStock, favoriteDraft)
      await fetchData()
    } catch {
      setError('즐겨찾기 저장에 실패했어.')
    } finally {
      setFavoriteSaving(false)
    }
  }, [favoriteDraft, fetchData, selectedStock])

  const handleDeleteFavorite = useCallback(async (id: string) => {
    setFavoriteDeletingId(id)
    try {
      await deleteFavoriteItem(id)
      await fetchData()
    } catch {
      setError('즐겨찾기 삭제에 실패했어.')
    } finally {
      setFavoriteDeletingId('')
    }
  }, [fetchData])

  const chartWidth = Math.max(300, Math.min(width - 28, 760))

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.headerWrap}>
        <View style={styles.headerGradient}>
          <Text style={styles.brand}>SignalDesk</Text>
          <Text style={styles.headerTitle}>Mobile Dashboard</Text>
          <Text style={styles.headerSubtitle}>시장/차트/추천 로그를 앱에서 빠르게 확인</Text>
          <Text style={styles.apiText}>API: {API_BASE_URL}</Text>
          <View style={styles.headerMetaRow}>
            <Text style={[styles.headerStatusBadge, apiHealth?.status === 'UP' ? styles.headerStatusBadgeUp : styles.headerStatusBadgeDown]}>
              {apiHealth?.status === 'UP' ? 'API 정상' : 'API 확인 필요'}
            </Text>
            <Text style={styles.headerMetaText}>
              {lastSyncedAt ? `최근 동기화 ${lastSyncedAt}` : '동기화 대기 중'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.tabRow}>
        {([
          { key: 'home', label: '홈' },
          { key: 'market', label: '시장' },
          { key: 'stocks', label: '종목' },
          { key: 'ai', label: 'AI' },
        ] as Array<{ key: TabKey; label: string }>).map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tabButton, activeTab === tab.key && styles.tabButtonActive]}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator />
          <Text style={styles.metaText}>데이터 로딩 중...</Text>
        </View>
      ) : null}

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>연결 오류</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorText}>API 상태와 네트워크 설정을 확인해.</Text>
          <Pressable
            onPress={() => {
              setLoading(true)
              void fetchData().finally(() => setLoading(false))
            }}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </Pressable>
        </View>
      ) : null}

      {!loading && !error && activeTab === 'home' ? (
        <HomeTab
          summary={summary}
          watchlist={watchlist}
          portfolio={portfolio}
          refreshing={refreshing}
          onRefresh={onRefresh}
          homeQuery={homeQuery}
          onHomeQueryChange={setHomeQuery}
          filteredWatchlist={filteredWatchlist}
          filteredPortfolioPositions={filteredPortfolioPositions}
          topWatchlist={topWatchlist}
          topPortfolioPositions={topPortfolioPositions}
          successRate={successRate}
        />
      ) : null}

      {!loading && !error && activeTab === 'market' ? (
        <MarketTab
          activeSection={activeSection}
          activeIndex={activeIndex}
          activePeriod={activePeriod}
          chartMarket={chartMarket}
          chartPeriod={chartPeriod}
          selectedIndexLabel={selectedIndexLabel}
          chartWidth={chartWidth}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onChartMarketChange={setChartMarket}
          onChartPeriodChange={setChartPeriod}
          onSelectedIndexLabelChange={setSelectedIndexLabel}
        />
      ) : null}

      {!loading && !error && activeTab === 'stocks' ? (
        <StocksTab
          watchlist={watchlist}
          stockSearch={stockSearch}
          stockMarketFilter={stockMarketFilter}
          stockResults={stockResults}
          stockSearchLoading={stockSearchLoading}
          selectedStockKey={selectedStockKey}
          selectedStock={selectedStock}
          favoriteDraft={favoriteDraft}
          favoriteSaving={favoriteSaving}
          favoriteDeletingId={favoriteDeletingId}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onStockSearchChange={setStockSearch}
          onStockMarketFilterChange={setStockMarketFilter}
          onSelectedStockKeyChange={setSelectedStockKey}
          onFavoriteDraftChange={setFavoriteDraft}
          onSaveFavorite={() => void handleSaveFavorite()}
          onDeleteFavorite={(id) => void handleDeleteFavorite(id)}
        />
      ) : null}

      {!loading && !error && activeTab === 'ai' ? (
        <AITab
          aiRecommendation={aiRecommendation}
          filteredLogs={filteredLogs}
          logFilter={logFilter}
          logQuery={logQuery}
          recommendLogs={recommendLogs}
          resultLogs={resultLogs}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onLogFilterChange={setLogFilter}
          onLogQueryChange={setLogQuery}
        />
      ) : null}
    </SafeAreaView>
  )
}
