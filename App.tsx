import { StatusBar } from 'expo-status-bar'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Platform,
  Pressable,
  SafeAreaView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { BarChart3, Bell, Bot, Home, LogOut, Moon, Sun, Sunrise, TrendingUp } from 'lucide-react-native'
import { WebLayout } from './src/web/WebLayout'
import { useStyles } from './src/styles'
import { ThemeProvider, useTheme } from './src/theme'
import { Toast } from './src/components/Toast'
import { AuthScreen } from './src/components/AuthScreen'
import { WebFrame } from './src/components/WebFrame'
import { webBootstrap } from './src/utils/webBootstrap'
import { useToast } from './src/hooks/useToast'
import { hapticLight } from './src/utils/haptics'
import { AITab } from './src/tabs/AITab'
import { HomeTab } from './src/tabs/HomeTab'
import { MarketTab } from './src/tabs/MarketTab'
import { StocksTab } from './src/tabs/StocksTab'
import { TodayTab } from './src/tabs/TodayTab'
import { HomeDashboard } from './src/web/HomeDashboard'
import { StocksPage } from './src/web/StocksPage'
import { CommandPalette } from './src/web/CommandPalette'
import { AIWorkspace } from './src/web/AIWorkspace'
import { StockDetailModal, type StockDetailContext } from './src/components/StockDetailModal'
import { ReminderSettingsModal } from './src/components/ReminderSettingsModal'
import { useMarketReminderBootstrap } from './src/hooks/useMarketReminder'
import { usePushDeepLink } from './src/hooks/usePushDeepLink'
import { useAuthSession } from './src/hooks/useAuthSession'
import { useChartSelection } from './src/hooks/useChartSelection'
import { useMarketSnapshot } from './src/hooks/useMarketSnapshot'
import { useStockSearch } from './src/hooks/useStockSearch'
import { useWorkspaceMutations } from './src/hooks/useWorkspaceMutations'
import type {
  HoldingPosition,
  MarketKey,
  PeriodKey,
  StockSearchResult,
  TabKey,
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

  // 웹: viewport meta + body 배경 + safe-area 패딩 1회 세팅.
  // 테마 바뀔 때마다 body bg 만 업데이트.
  useEffect(() => { webBootstrap(palette.bg) }, [palette.bg])

  // ── 인증 ─────────────────────────────────────
  const { authChecked, user, handleAuthDone, handleLogout } = useAuthSession()

  const [activeTab, setActiveTab] = useState<TabKey>('today')
  const market = useMarketSnapshot(user?.token ?? null, !!user)
  const {
    summary, sections, aiRecommendation, watchlist, portfolio, fortune, topMovers,
    alertHistory, apiHealth, lastSyncedAt, loading, refreshing, error, refresh,
    fetchData, setLoading, setWatchlist, setPortfolio,
  } = market
  const search = useStockSearch()
  const {
    stockSearch, stockMarketFilter, stockResults, stockSearchLoading,
    setStockSearch, setStockMarketFilter,
  } = search
  const [homeQuery, setHomeQuery] = useState('')
  const chart = useChartSelection(sections)
  const {
    chartMarket, chartPeriod, selectedIndexLabel,
    setChartMarket, setChartPeriod, setSelectedIndexLabel,
    activeSection, activeIndex, activePeriod,
  } = chart
  const mutations = useWorkspaceMutations({
    watchlist, setWatchlist, setPortfolio, fetchData, toast,
  })
  const {
    favoriteDeletingId, bulkDeletingWatch,
    handleSavePortfolio, handleDeletePortfolio,
    handleQuickAddWatch, handleDeleteFavorite, handleDeleteAllFavorites,
    handleToggleWatchInDetail,
  } = mutations

  // ── 종목 상세 모달 (어느 탭에서든 같은 모달) ──────
  const [detailKey, setDetailKey] = useState('')        // 'MARKET:TICKER' or ''
  const [detailFallbackName, setDetailFallbackName] = useState('')

  // ── 알림 설정 모달 ──────
  const [reminderOpen, setReminderOpen] = useState(false)

  // 로그인 후 1회: 권한 요청 + 켜진 알림 다시 예약
  useMarketReminderBootstrap(!!user)

  const handleTabChange = useCallback((key: TabKey) => {
    if (key === activeTab) return
    void hapticLight()
    setActiveTab(key)
  }, [activeTab])

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

  // 웹(데스크톱)에선 정보 밀도 ↑ — 홈의 top-N 을 훨씬 더 많이 보여줌.
  const listLimit = Platform.OS === 'web' ? 12 : 4
  const topWatchlist = useMemo(() => filteredWatchlist.slice(0, listLimit), [filteredWatchlist, listLimit])
  const topPortfolioPositions = useMemo(() => filteredPortfolioPositions.slice(0, listLimit), [filteredPortfolioPositions, listLimit])
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

  usePushDeepLink(handleOpenDetail)

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
        <WebFrame variant="auth">
          <AuthScreen onDone={(u) => void handleAuthDone(u)} />
        </WebFrame>
      </SafeAreaView>
    )
  }

  // 탭 컨텐츠 — 웹/네이티브 셸에서 공유.
  const tabContent = (
    <>
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

      {!loading && !error && activeTab === 'today' ? (
        Platform.OS === 'web' ? (
          <HomeDashboard
            summary={summary}
            aiRecommendation={aiRecommendation}
            positions={portfolio?.positions ?? []}
            watchlist={watchlist}
            alertHistory={alertHistory}
            topMovers={topMovers}
            portfolio={portfolio}
            onOpenDetail={handleOpenDetail}
          />
        ) : (
          <TodayTab
            summary={summary}
            aiRecommendation={aiRecommendation}
            positions={portfolio?.positions ?? []}
            alertHistory={alertHistory}
            fortune={fortune}
            onOpenDetail={handleOpenDetail}
            refreshing={refreshing}
            onRefresh={refresh}
          />
        )
      ) : null}

      {!loading && !error && activeTab === 'home' ? (
        <HomeTab
          watchlist={watchlist}
          portfolio={portfolio}
          refreshing={refreshing}
          onRefresh={refresh}
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
          topMovers={topMovers}
          onOpenDetail={handleOpenDetail}
          refreshing={refreshing}
          onRefresh={refresh}
          onChartMarketChange={setChartMarket}
          onChartPeriodChange={setChartPeriod}
          onSelectedIndexLabelChange={setSelectedIndexLabel}
        />
      ) : null}

      {!loading && !error && activeTab === 'stocks' ? (
        Platform.OS === 'web' ? (
          <StocksPage
            watchlist={watchlist}
            portfolio={portfolio}
            stockSearch={stockSearch}
            stockMarketFilter={stockMarketFilter}
            stockResults={stockResults}
            stockSearchLoading={stockSearchLoading}
            favoriteDeletingId={favoriteDeletingId}
            bulkDeleting={bulkDeletingWatch}
            onStockSearchChange={setStockSearch}
            onStockMarketFilterChange={setStockMarketFilter}
            onOpenDetail={handleOpenDetail}
            onQuickAddWatch={handleQuickAddWatch}
            onDeleteFavorite={(id) => void handleDeleteFavorite(id)}
            onDeleteAllFavorites={() => void handleDeleteAllFavorites()}
          />
        ) : (
          <StocksTab
            watchlist={watchlist}
            stockSearch={stockSearch}
            stockMarketFilter={stockMarketFilter}
            stockResults={stockResults}
            stockSearchLoading={stockSearchLoading}
            favoriteDeletingId={favoriteDeletingId}
            bulkDeleting={bulkDeletingWatch}
            refreshing={refreshing}
            onRefresh={refresh}
            onStockSearchChange={setStockSearch}
            onStockMarketFilterChange={setStockMarketFilter}
            onOpenDetail={handleOpenDetail}
            onQuickAddWatch={handleQuickAddWatch}
            onDeleteFavorite={(id) => void handleDeleteFavorite(id)}
            onDeleteAllFavorites={() => void handleDeleteAllFavorites()}
          />
        )
      ) : null}

      {!loading && !error && activeTab === 'ai' ? (
        Platform.OS === 'web' ? (
          <AIWorkspace
            aiRecommendation={aiRecommendation}
            summary={summary}
            watchlist={watchlist}
            onOpenDetail={handleOpenDetail}
            onQuickAddWatch={handleQuickAddWatch}
          />
        ) : (
          <AITab
            aiRecommendation={aiRecommendation}
            summary={summary}
            watchlist={watchlist}
            refreshing={refreshing}
            onRefresh={refresh}
            onOpenDetail={handleOpenDetail}
            onQuickAddWatch={handleQuickAddWatch}
          />
        )
      ) : null}
    </>
  )

  // 전역 모달 — 웹/네이티브 공유
  const overlays = (
    <>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} />
      <StockDetailModal
        visible={!!detailKey}
        onClose={handleCloseDetail}
        context={detailContext}
        onToggleWatch={handleToggleWatchInDetail}
        onSavePortfolio={handleSavePortfolio}
        onDeletePortfolio={(id) => void handleDeletePortfolio(id)}
      />
      <ReminderSettingsModal
        visible={reminderOpen}
        authToken={user?.token ?? null}
        onClose={() => setReminderOpen(false)}
      />
      {Platform.OS === 'web' ? (
        <CommandPalette
          watchlist={watchlist}
          onNavigateTab={handleTabChange}
          onOpenDetail={handleOpenDetail}
          onOpenReminder={() => setReminderOpen(true)}
        />
      ) : null}
    </>
  )

  // ── 웹: 사이드바 레이아웃 ──
  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <WebLayout
          user={user}
          activeTab={activeTab}
          isUp={isUp}
          lastSyncedAt={lastSyncedAt}
          onTabChange={handleTabChange}
          onLogout={() => void handleLogout()}
          onOpenReminder={() => { void hapticLight(); setReminderOpen(true) }}
          sections={sections}
          summary={summary}
          fortune={fortune}
          watchlist={watchlist}
          portfolio={portfolio}
          aiRecommendation={aiRecommendation}
          onOpenDetail={handleOpenDetail}
        >
          {tabContent}
        </WebLayout>
        {overlays}
      </SafeAreaView>
    )
  }

  // ── 네이티브 ── (기존 헤더 + 탭바 셸)
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
            {lastSyncedAt ? `마지막 동기화 ${lastSyncedAt}` : '오늘 하루를 한 화면에서'}
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

      {tabContent}
      {overlays}
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
