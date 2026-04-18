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
import { BarChart3, Bell, Bot, Home, LogOut, Moon, Sun, Sunrise, TrendingUp } from 'lucide-react-native'
import {
  API_BASE_URL,
  deleteFavoriteItem,
  deletePortfolioPosition,
  loadAllData,
  quickAddWatchItem,
  savePortfolioPosition,
  searchStocks,
} from './src/api'
import { useStyles } from './src/styles'
import { ThemeProvider, useTheme } from './src/theme'
import { Toast } from './src/components/Toast'
import { AuthScreen } from './src/components/AuthScreen'
import { useToast } from './src/hooks/useToast'
import { hapticLight, hapticSuccess, hapticError } from './src/utils/haptics'
import {
  type AuthUser,
  apiMe,
  clearAuth,
  loadStoredAuth,
  saveAuth,
  setMemoryToken,
} from './src/api/auth'
import { AITab } from './src/tabs/AITab'
import { HomeTab } from './src/tabs/HomeTab'
import { MarketTab } from './src/tabs/MarketTab'
import { StocksTab } from './src/tabs/StocksTab'
import { TodayTab } from './src/tabs/TodayTab'
import { StockDetailModal, type StockDetailContext } from './src/components/StockDetailModal'
import { ReminderSettingsModal } from './src/components/ReminderSettingsModal'
import { useMarketReminderBootstrap } from './src/hooks/useMarketReminder'
import type {
  AiRecommendationData,
  HealthResponse,
  HoldingPosition,
  LogFilter,
  MarketKey,
  MarketSectionsData,
  MarketSummaryData,
  PeriodKey,
  PortfolioSummary,
  StockMarketFilter,
  StockSearchResult,
  TabKey,
  WatchItem,
} from './src/types'
import { normalizeText } from './src/utils'

const TABS: Array<{ key: TabKey; label: string; Icon: typeof Home }> = [
  { key: 'today',  label: '오늘', Icon: Sunrise },
  { key: 'home',   label: '홈',   Icon: Home },
  { key: 'market', label: '시장', Icon: TrendingUp },
  { key: 'stocks', label: '종목', Icon: BarChart3 },
  { key: 'ai',     label: 'AI',   Icon: Bot },
]

function AppShell() {
  const { width } = useWindowDimensions()
  const styles = useStyles()
  const { palette, toggle, mode } = useTheme()
  const toast = useToast()

  // ── 인증 상태 ─────────────────────────────────────
  const [authChecked, setAuthChecked] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    void (async () => {
      const stored = await loadStoredAuth()
      if (stored) {
        setMemoryToken(stored.token)
        // 토큰 유효성 검증 (서버 me 호출)
        try {
          const fresh = await apiMe(stored.token)
          setUser({ ...fresh, token: stored.token })
          await saveAuth({ ...fresh, token: stored.token })
        } catch {
          // 만료된 토큰
          await clearAuth()
          setMemoryToken(null)
          setUser(null)
        }
      }
      setAuthChecked(true)
    })()
  }, [])

  const handleAuthDone = useCallback(async (u: AuthUser) => {
    setMemoryToken(u.token)
    await saveAuth(u)
    setUser(u)
  }, [])

  const handleLogout = useCallback(async () => {
    void hapticLight()
    await clearAuth()
    setMemoryToken(null)
    setUser(null)
  }, [])

  const [activeTab, setActiveTab] = useState<TabKey>('today')
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
  const [chartPeriod, setChartPeriod] = useState<PeriodKey>('D')
  const [selectedIndexLabel, setSelectedIndexLabel] = useState('')
  const [stockSearch, setStockSearch] = useState('')
  const [stockMarketFilter, setStockMarketFilter] = useState<StockMarketFilter>('ALL')
  const [stockResults, setStockResults] = useState<StockSearchResult[]>([])
  const [stockSearchLoading, setStockSearchLoading] = useState(false)
  const [favoriteDeletingId, setFavoriteDeletingId] = useState('')

  // ── 종목 상세 모달 (어느 탭에서든 같은 모달) ──────
  const [detailKey, setDetailKey] = useState('')        // 'MARKET:TICKER' or ''
  const [detailFallbackName, setDetailFallbackName] = useState('')

  // ── 알림 설정 모달 ──────
  const [reminderOpen, setReminderOpen] = useState(false)

  // 로그인 후 1회: 권한 요청 + 켜진 알림 다시 예약
  useMarketReminderBootstrap(!!user)

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
      setError(`서버에 연결할 수 없어요.\n${API_BASE_URL}`)
    }
  }, [])

  useEffect(() => {
    if (!user) return
    setLoading(true)
    void fetchData().finally(() => setLoading(false))
  }, [fetchData, user])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    void hapticLight()
    await fetchData()
    setRefreshing(false)
  }, [fetchData])

  const handleTabChange = useCallback((key: TabKey) => {
    if (key === activeTab) return
    void hapticLight()
    setActiveTab(key)
  }, [activeTab])

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

  // 어느 탭에서든 호출 가능한 "종목 상세 열기"
  const handleOpenDetail = useCallback((market: string, ticker: string, name?: string) => {
    if (!market || !ticker) return
    void hapticLight()
    setDetailKey(`${market}:${ticker}`)
    setDetailFallbackName(name ?? '')
  }, [])
  const handleCloseDetail = useCallback(() => {
    setDetailKey('')
    setDetailFallbackName('')
  }, [])

  // detailKey → 표준 스냅샷. 검색결과/관심종목/보유 어디서든 만들 수 있음.
  const detailContext = useMemo<StockDetailContext | null>(() => {
    const [market, ticker] = detailKey.split(':')
    if (!market || !ticker) return null
    const fromSearch    = stockResults.find((r) => r.market === market && r.ticker === ticker)
    const watchItem     = watchlist.find((w) => w.market === market && w.ticker === ticker)
    const portfolioPos  = portfolio?.positions.find((p) => p.market === market && p.ticker === ticker)
    const latestAiLog   = (aiRecommendation?.executionLogs ?? []).find(
      (item) => item.market === market && item.ticker === ticker,
    )
    const base: StockSearchResult = fromSearch ?? {
      market,
      ticker,
      name:       watchItem?.name ?? portfolioPos?.name ?? detailFallbackName ?? ticker,
      sector:     watchItem?.sector ?? '—',
      price:      watchItem?.price ?? portfolioPos?.currentPrice ?? 0,
      changeRate: watchItem?.changeRate ?? 0,
      stance:     watchItem?.stance ?? '관찰 대상',
    }
    return { base, watchItem, portfolioPosition: portfolioPos, latestAiLog }
  }, [detailKey, detailFallbackName, stockResults, watchlist, portfolio?.positions, aiRecommendation?.executionLogs])

  const handleSavePortfolio = useCallback(async (payload: {
    id?: string
    market: string
    ticker: string
    name: string
    buyPrice: number
    currentPrice: number
    quantity: number
  }) => {
    try {
      await savePortfolioPosition(payload)
      await fetchData()
      void hapticSuccess()
      toast.show(payload.id ? '보유 종목을 수정했어요' : '보유 종목으로 등록했어요', 'success')
    } catch {
      void hapticError()
      toast.show('저장에 실패했어요. 입력값을 확인해줘', 'error')
      throw new Error('save-portfolio-failed')
    }
  }, [fetchData, toast])

  const handleDeletePortfolio = useCallback(async (id: string) => {
    try {
      await deletePortfolioPosition(id)
      await fetchData()
      void hapticSuccess()
      toast.show('보유 종목을 삭제했어요', 'info')
    } catch {
      void hapticError()
      toast.show('삭제에 실패했어요', 'error')
    }
  }, [fetchData, toast])

  const handleQuickAddWatch = useCallback(async (stock: StockSearchResult) => {
    try {
      await quickAddWatchItem(stock)
      await fetchData()
      void hapticSuccess()
      toast.show('관심종목에 담았어요', 'success')
    } catch {
      void hapticError()
      toast.show('관심종목 추가에 실패했어요', 'error')
      throw new Error('quick-add-failed')
    }
  }, [fetchData, toast])

  const handleDeleteFavorite = useCallback(async (id: string) => {
    setFavoriteDeletingId(id)
    try {
      await deleteFavoriteItem(id)
      await fetchData()
      void hapticSuccess()
      toast.show('관심종목에서 해제했어요', 'info')
    } catch {
      void hapticError()
      toast.show('해제에 실패했어요', 'error')
    } finally {
      setFavoriteDeletingId('')
    }
  }, [fetchData, toast])

  // 모달용: 현재 관심 여부에 따라 자동으로 추가/해제 토글
  const handleToggleWatchInDetail = useCallback(async (stock: StockSearchResult) => {
    const existing = watchlist.find((w) => w.market === stock.market && w.ticker === stock.ticker)
    if (existing?.id) {
      await handleDeleteFavorite(existing.id)
    } else {
      await handleQuickAddWatch(stock)
    }
  }, [watchlist, handleDeleteFavorite, handleQuickAddWatch])

  const chartWidth = Math.max(300, Math.min(width - 28, 760))
  const isUp = apiHealth?.status === 'UP'
  const isDark = palette.scheme === 'dark'

  // ── 인증 분기 ──
  if (!authChecked) {
    return (
      <SafeAreaView style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={palette.blue} />
      </SafeAreaView>
    )
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <AuthScreen onDone={(u) => void handleAuthDone(u)} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={isDark ? 'light' : 'light'} />

      {/* ── 헤더 ─────────────────────────────────────── */}
      <View style={styles.headerWrap}>
        <View style={styles.headerGradient}>
          <View style={styles.headerTopRow}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, flexShrink: 1 }}>
              <Text style={styles.headerTitle} numberOfLines={1}>투자 대시보드</Text>
              <Text style={styles.brand}>SIGNAL</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={[styles.headerStatusPill, isUp ? styles.headerStatusPillUp : styles.headerStatusPillDown]}>
                <View style={[styles.headerStatusDot, isUp ? styles.headerStatusDotUp : styles.headerStatusDotDown]} />
                <Text style={[styles.headerStatusText, isUp ? styles.headerStatusTextUp : styles.headerStatusTextDown]}>
                  {isUp ? 'LIVE' : 'OFF'}
                </Text>
              </View>
              <Pressable
                onPress={() => { void hapticLight(); setReminderOpen(true) }}
                style={({ pressed }) => [styles.themeToggleBtn, pressed && { opacity: 0.6 }]}
                accessibilityLabel="알림 설정"
              >
                <Bell size={16} color="#cbd5e1" />
              </Pressable>
              <Pressable
                onPress={() => { void hapticLight(); toggle() }}
                style={({ pressed }) => [styles.themeToggleBtn, pressed && { opacity: 0.6 }]}
                accessibilityLabel={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
              >
                {isDark ? <Sun size={16} color="#fcd34d" /> : <Moon size={16} color="#cbd5e1" />}
              </Pressable>
              <Pressable
                onPress={() => void handleLogout()}
                style={({ pressed }) => [styles.themeToggleBtn, pressed && { opacity: 0.6 }]}
                accessibilityLabel="로그아웃"
              >
                <LogOut size={16} color="#fca5a5" />
              </Pressable>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>
            {lastSyncedAt ? `마지막 동기화 ${lastSyncedAt}` : '시장/차트/포트폴리오를 한눈에'}
          </Text>
        </View>
      </View>

      {/* ── 탭 바 ────────────────────────────────────── */}
      <View style={styles.tabBar}>
        {TABS.map(({ key, label, Icon }) => {
          const active = activeTab === key
          return (
            <Pressable
              key={key}
              onPress={() => handleTabChange(key)}
              style={({ pressed }) => [styles.tabItem, active && styles.tabItemActive, pressed && styles.tabItemPressed]}
            >
              <Icon
                size={20}
                color={active ? palette.blue : palette.inkFaint}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
              {active && <View style={styles.tabActiveBar} />}
            </Pressable>
          )
        })}
      </View>

      {/* ── 로딩 ─────────────────────────────────────── */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={palette.blue} />
          <Text style={styles.loadingText}>데이터 불러오는 중...</Text>
        </View>
      ) : null}

      {/* ── 에러 ─────────────────────────────────────── */}
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>연결 실패</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            onPress={() => {
              setLoading(true)
              void fetchData().finally(() => setLoading(false))
            }}
            style={({ pressed }) => [styles.retryButton, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </Pressable>
        </View>
      ) : null}

      {/* ── 탭 콘텐츠 ────────────────────────────────── */}
      {!loading && !error && activeTab === 'today' ? (
        <TodayTab
          summary={summary}
          aiRecommendation={aiRecommendation}
          positions={portfolio?.positions ?? []}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      ) : null}

      {!loading && !error && activeTab === 'home' ? (
        <HomeTab
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
          onOpenDetail={handleOpenDetail}
          onRemoveWatch={(id) => void handleDeleteFavorite(id)}
        />
      ) : null}

      {!loading && !error && activeTab === 'market' ? (
        <MarketTab
          summary={summary}
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
          favoriteDeletingId={favoriteDeletingId}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onStockSearchChange={setStockSearch}
          onStockMarketFilterChange={setStockMarketFilter}
          onOpenDetail={handleOpenDetail}
          onQuickAddWatch={handleQuickAddWatch}
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

      <Toast visible={toast.visible} message={toast.message} type={toast.type} />

      {/* ── 종목 상세 모달 (어느 탭에서든 호출) ── */}
      <StockDetailModal
        visible={!!detailKey}
        onClose={handleCloseDetail}
        context={detailContext}
        onToggleWatch={handleToggleWatchInDetail}
        onSavePortfolio={handleSavePortfolio}
        onDeletePortfolio={(id) => void handleDeletePortfolio(id)}
      />

      {/* ── 알림 설정 모달 ── */}
      <ReminderSettingsModal
        visible={reminderOpen}
        onClose={() => setReminderOpen(false)}
      />
    </SafeAreaView>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  )
}
