import { StatusBar } from 'expo-status-bar'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { BarChart3, Bot, Megaphone, Settings as SettingsIcon, Sunrise, Trophy } from 'lucide-react-native'
import { WebLayout } from './src/web/WebLayout'
import { useStyles } from './src/styles'
import { ThemeProvider, useTheme } from './src/theme'
import { Toast } from './src/components/Toast'
import { AuthScreen } from './src/components/AuthScreen'
import { OnboardingScreen } from './src/components/OnboardingScreen'
import { MarketProfileChip } from './src/components/MarketProfileChip'
import { V2MigrationModal } from './src/components/V2MigrationModal'
import {
  getOnboardingCompleted, markOnboardingCompleted,
  getV2MigrationShown, markV2MigrationShown,
} from './src/utils/onboarding'
import { WebFrame } from './src/components/WebFrame'
import { webBootstrap } from './src/utils/webBootstrap'
import { useToast } from './src/hooks/useToast'
import { hapticLight } from './src/utils/haptics'
import { AITab } from './src/tabs/AITab'
import { LeagueTab } from './src/tabs/LeagueTab'
import { ReadingTab } from './src/tabs/ReadingTab'
import { ComposePostModal } from './src/components/reading_parts/ComposePostModal'
import { CreateLeagueModal } from './src/components/league_parts/CreateLeagueModal'
import { LeagueDetailModal } from './src/components/league_parts/LeagueDetailModal'
import { SettingsModal } from './src/components/SettingsModal'
import { SystemStatusBanner } from './src/components/SystemStatusBanner'
import { StocksTab } from './src/tabs/StocksTab'
import { TodayTab } from './src/tabs/TodayTab'
import { HomeDashboard } from './src/web/HomeDashboard'
import { StocksPage } from './src/web/StocksPage'
import { CommandPalette } from './src/web/CommandPalette'
import { AIWorkspace } from './src/web/AIWorkspace'
import { StockDetailModal, type StockDetailContext } from './src/components/StockDetailModal'
import { ReminderSettingsModal } from './src/components/ReminderSettingsModal'
import { getAlertPreferences, updateAlertPreferences, type MarketPreference } from './src/api/alertPreferences'
import { DailyGreetingModal } from './src/components/DailyGreetingModal'
import { LoadingScreen } from './src/components/LoadingScreen'
import { getFortuneGreetingShownDate, markFortuneGreetingShown } from './src/utils/fortuneGreeting'
import { useMarketReminderBootstrap } from './src/hooks/useMarketReminder'
import { usePushDeepLink } from './src/hooks/usePushDeepLink'
import { useAuthSession } from './src/hooks/useAuthSession'
// v2 Phase 3: useChartSelection 은 ChartSection 재배치 시 (Phase 4+ Beta 후) 복구
import { useMarketSnapshot } from './src/hooks/useMarketSnapshot'
import { useStockSearch } from './src/hooks/useStockSearch'
import { useWorkspaceMutations } from './src/hooks/useWorkspaceMutations'
import type {
  StockSearchResult,
  TabKey,
} from './src/types'

// v2.2: 5탭 (today/stocks/ai/league/reading). reading 은 종목·시황 콜 공유 신규.
const TABS: Array<{ key: TabKey; label: string; Icon: typeof Sunrise }> = [
  { key: 'today',   label: '오늘', Icon: Sunrise },
  { key: 'stocks',  label: '종목', Icon: BarChart3 },
  { key: 'ai',      label: 'AI',   Icon: Bot },
  { key: 'league',  label: '리그', Icon: Trophy },
  { key: 'reading', label: '리딩', Icon: Megaphone },
]

function AppShell() {
  // v2: useWindowDimensions 은 chartWidth 부재로 미사용 — Phase 4+ 차트 복귀 시 부활.
  const styles = useStyles()
  const { palette, mode, setMode } = useTheme()
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
    mediaSummary, marketInsight, upcomingEvents, disclosures, aiPicks, hiddenSignals, alertHistory, apiHealth, systemStatus, lastSyncedAt, loading, refreshing, error, refresh,
    fetchData, setLoading, setWatchlist, setPortfolio,
  } = market
  const search = useStockSearch()
  const {
    stockSearch, stockMarketFilter, stockResults, stockSearchLoading,
    setStockSearch, setStockMarketFilter,
  } = search
  // v2 Phase 3 정리: HomeTab / MarketTab 삭제됨 → homeQuery + 차트 셀렉션 hook 제거.
  // 차트는 Phase 4+ Beta 후 'today' 의 ChartSection 으로 다시 들어올 수 있음 — 그 때 useChartSelection 복구.
  const mutations = useWorkspaceMutations({
    watchlist, setWatchlist, setPortfolio, fetchData, toast,
  })
  const {
    favoriteDeletingId, bulkDeletingWatch,
    handleSavePortfolio, handleDeletePortfolio,
    handleQuickAddWatch, handleDeleteFavorite, handleDeleteAllFavorites,
    handleToggleWatchInDetail, handleSaveWatchAlerts,
  } = mutations

  // ── 종목 상세 모달 (어느 탭에서든 같은 모달) ──────
  const [detailKey, setDetailKey] = useState('')        // 'MARKET:TICKER' or ''
  const [detailFallbackName, setDetailFallbackName] = useState('')

  // ── 알림 설정 모달 ──────
  const [reminderOpen, setReminderOpen] = useState(false)

  // ── 투자 시장 선호 (UI 필터링 — MarketTab/StocksTab 등) ──
  const [marketPreference, setMarketPreference] = useState<MarketPreference>('BOTH')
  const preferenceSyncedRef = useRef(false)

  // v2 온보딩 상태 — 미완료 신규 사용자만 OnboardingScreen 노출.
  // 기존 v1 사용자는 marketPreference 가 이미 있으므로 첫 진입에서 자동 markCompleted 후 스킵.
  const [onboardingState, setOnboardingState] = useState<'loading' | 'show' | 'done'>('loading')
  // v1 → v2 마이그레이션 모달 — 1회 노출 후 마크.
  const [v2MigrationOpen, setV2MigrationOpen] = useState(false)
  // v2.1: 리그 생성 모달 + 리그 탭 새로고침 트리거 + 리그 상세 모달
  const [createLeagueOpen, setCreateLeagueOpen] = useState(false)
  const [leagueRefreshTick, setLeagueRefreshTick] = useState(0)
  const [activeLeagueId, setActiveLeagueId] = useState<string | null>(null)
  // v2.1: 통합 설정 모달
  const [settingsOpen, setSettingsOpen] = useState(false)
  // v2.2: 리딩 — 작성 모달 + 피드 새로고침 트리거
  const [composeOpen, setComposeOpen] = useState(false)
  const [readingRefreshTick, setReadingRefreshTick] = useState(0)

  useEffect(() => {
    const tok = user?.token
    if (!tok) {
      setOnboardingState('loading')
      return
    }
    void (async () => {
      const [p, completed] = await Promise.all([
        getAlertPreferences(tok),
        getOnboardingCompleted(),
      ])
      if (p.marketPreference) setMarketPreference(p.marketPreference)
      // 이미 완료했으면 그대로 진입. 미완료지만 marketPreference 가 있으면(v1 사용자) 자동 완료 처리.
      if (completed) {
        setOnboardingState('done')
        // 완료된 사용자 중 v2 마이그레이션 모달 아직 안 본 경우 1회 노출.
        // 진입 직후 갑작스러우면 어색 → 700ms 지연으로 메인 그려진 뒤 자연스럽게 노출.
        const migShown = await getV2MigrationShown()
        if (!migShown) setTimeout(() => setV2MigrationOpen(true), 700)
      } else if (p.marketPreference) {
        // v1 사용자 — 온보딩 한 적 없지만 marketPreference 가 있으므로 신규 아님.
        await markOnboardingCompleted()
        setOnboardingState('done')
        const migShown = await getV2MigrationShown()
        if (!migShown) setTimeout(() => setV2MigrationOpen(true), 700)
      } else {
        setOnboardingState('show')
        // 신규 사용자는 온보딩 자체가 v2 안내라 별도 마이그레이션 모달 불필요.
        await markV2MigrationShown()
      }
    })()
  }, [user?.token])

  // v2 마이그레이션 모달 confirm — 시장 선호 즉시 반영 + 마크.
  const handleV2MigrationConfirm = useCallback(async (pref: MarketPreference) => {
    setMarketPreference(pref)
    setV2MigrationOpen(false)
    await markV2MigrationShown()
    if (user?.token) {
      try {
        const current = await getAlertPreferences(user.token)
        await updateAlertPreferences(user.token, { ...current, marketPreference: pref })
      } catch { /* 실패해도 로컬 상태는 변경됨 */ }
    }
  }, [user?.token])

  // v2: 헤더 시장 칩 변경 공통 핸들러 — 모바일/웹 양쪽이 같은 동작 (즉시 반영 + 토스트 + 백엔드 동기).
  const handleMarketPreferenceChange = useCallback((pref: MarketPreference) => {
    setMarketPreference(pref)
    const label = pref === 'KR' ? '🇰🇷 한국 시장' : pref === 'US' ? '🇺🇸 미국 시장' : '🌍 양쪽 시장'
    toast.show(`${label} 으로 전환`)
    if (user?.token) {
      void (async () => {
        try {
          const current = await getAlertPreferences(user.token)
          await updateAlertPreferences(user.token, { ...current, marketPreference: pref })
        } catch { /* 실패해도 UI 는 즉시 반영 */ }
      })()
    }
  }, [user?.token, toast])

  const handleOnboardingComplete = useCallback((pref: MarketPreference) => {
    setMarketPreference(pref)
    setOnboardingState('done')
  }, [])
  // 선호값을 최초 1회만 종목 탭 검색 필터 디폴트에 반영. 이후 사용자 토글은 보존.
  // v2: 차트 셀렉션은 MarketTab 와 함께 제거 — 종목 탭 필터만 동기화.
  useEffect(() => {
    if (preferenceSyncedRef.current) return
    if (marketPreference === 'BOTH') return  // BOTH 는 기존 디폴트 유지
    preferenceSyncedRef.current = true
    if (marketPreference === 'US') {
      setStockMarketFilter('US')
    } else if (marketPreference === 'KR') {
      setStockMarketFilter('KR')
    }
  }, [marketPreference, setStockMarketFilter])

  // ── 오늘의 운세 팝업 (앱 전용, 하루 1회) ──
  const [greetingOpen, setGreetingOpen] = useState(false)
  const greetingTriggered = useRef(false)
  useEffect(() => {
    if (Platform.OS === 'web') return
    if (!fortune || greetingTriggered.current) return
    greetingTriggered.current = true
    void (async () => {
      // 같은 날 이미 띄웠으면 skip — 날짜가 바뀌어야 다시 노출.
      const shownDate = await getFortuneGreetingShownDate()
      if (shownDate !== fortune.date) {
        setGreetingOpen(true)
        await markFortuneGreetingShown(fortune.date)
      }
    })()
  }, [fortune])

  const confirmLogout = useCallback(() => {
    Alert.alert('로그아웃', '정말 로그아웃할까?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: () => void handleLogout() },
    ])
  }, [handleLogout])

  // 로그인 후 1회: 권한 요청 + 켜진 알림 다시 예약
  useMarketReminderBootstrap(!!user)

  const handleTabChange = useCallback((key: TabKey) => {
    if (key === activeTab) return
    void hapticLight()
    setActiveTab(key)
  }, [activeTab])

  // 시장 선호에 따라 AI 픽·숨은 시그널 필터 — 선호 시장 종목만 추천 (BOTH 면 그대로).
  const filteredAiPicks = useMemo(() => {
    if (!aiPicks || marketPreference === 'BOTH') return aiPicks
    return { ...aiPicks, picks: aiPicks.picks.filter((p) => p.market === marketPreference) }
  }, [aiPicks, marketPreference])
  const filteredHiddenSignals = useMemo(() => {
    if (!hiddenSignals || marketPreference === 'BOTH') return hiddenSignals
    return { ...hiddenSignals, signals: hiddenSignals.signals.filter((s) => s.market === marketPreference) }
  }, [hiddenSignals, marketPreference])
  // aiRecommendation 안의 picks/executionLogs 도 동일 필터 (TodayTab의 단타 픽 PicksCard 대응).
  const filteredAiRecommendation = useMemo(() => {
    if (!aiRecommendation || marketPreference === 'BOTH') return aiRecommendation
    const m = marketPreference
    return {
      ...aiRecommendation,
      executionLogs: aiRecommendation.executionLogs.filter((l) => l.market === m),
    }
  }, [aiRecommendation, marketPreference])

  // 시장 선호에 따라 이벤트 필터 — 휴장/실적은 선호 시장만, FOMC/매크로는 항상 노출.
  const filteredUpcomingEvents = useMemo(() => {
    if (marketPreference === 'BOTH') return upcomingEvents
    const globalCats = new Set(['FOMC', 'POLICY', 'ECONOMIC_DATA'])
    return upcomingEvents.filter((e) => {
      if (e.market === 'GLOBAL') return true
      if (globalCats.has(e.category)) return true
      return e.market === marketPreference
    })
  }, [upcomingEvents, marketPreference])

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

  const handleNavigateToday = useCallback(() => {
    setActiveTab('today')
  }, [])

  // v2: 'market' 탭이 'today' 로 흡수됨 — Market 콘텐츠는 today 에서 노출되므로 같은 핸들러 재사용.
  const handleNavigateMarket = useCallback(() => {
    setActiveTab('today')
  }, [])

  // v2.1: League 푸시 deep link — 리그 탭 + 상세 모달 자동 진입.
  const handleOpenLeagueFromPush = useCallback((leagueId: string) => {
    setActiveTab('league')
    setActiveLeagueId(leagueId)
  }, [])

  usePushDeepLink(handleOpenDetail, handleNavigateToday, handleNavigateMarket, handleOpenLeagueFromPush)

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

  // v2: chartWidth 는 ChartSection 부재로 미사용 — Phase 4+ 차트 복귀 시 부활.
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

  // ── v2 온보딩 분기 ──
  // 사용자 로그인 + 온보딩 상태 결정 전: 로딩.
  if (onboardingState === 'loading') {
    return (
      <SafeAreaView style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={palette.brandAccent} />
      </SafeAreaView>
    )
  }
  // 온보딩 미완료 신규 사용자만 OnboardingScreen 노출.
  if (onboardingState === 'show') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <OnboardingScreen authToken={user.token} onComplete={handleOnboardingComplete} />
      </SafeAreaView>
    )
  }

  // 탭 컨텐츠 — 웹/네이티브 셸에서 공유.
  const tabContent = (
    <>
      {/* ── 로딩 (투자 명언 로테이션) ─────────────────── */}
      {loading ? <LoadingScreen /> : null}

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

      {/* v2.1: 시스템 헬스 배너 — Gemini 일시 장애 시 상단 안내 (모든 탭에서 같이 노출) */}
      {!loading && !error ? <SystemStatusBanner status={systemStatus} /> : null}

      {!loading && !error && activeTab === 'today' ? (
        Platform.OS === 'web' ? (
          <HomeDashboard
            summary={summary}
            aiRecommendation={filteredAiRecommendation}
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
            aiRecommendation={filteredAiRecommendation}
            positions={portfolio?.positions ?? []}
            alertHistory={alertHistory}
            fortune={fortune}
            mediaSummary={mediaSummary}
            upcomingEvents={filteredUpcomingEvents}
            disclosures={disclosures}
            topMovers={topMovers}
            marketPreference={marketPreference}
            onOpenDetail={handleOpenDetail}
            refreshing={refreshing}
            onRefresh={refresh}
          />
        )
      ) : null}
      {/* v2: 'home', 'market' 탭은 'today' 로 흡수됨 — HomeTab/MarketTab 호출 제거. */}
      {/* HomeTab 의 워크스페이스 검색 기능(homeQuery) 은 Phase 3 에서 '종목' 탭으로 흡수. */}
      {/* MarketTab 의 ChartSection 도 Phase 3 에서 'today' 또는 '종목' 으로 이전 검토. */}

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
            portfolio={portfolio}
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
            aiRecommendation={filteredAiRecommendation}
            summary={summary}
            watchlist={watchlist}
            onOpenDetail={handleOpenDetail}
            onQuickAddWatch={handleQuickAddWatch}
          />
        ) : (
          <AITab
            aiPicks={filteredAiPicks}
            hiddenSignals={filteredHiddenSignals}
            summary={summary}
            watchlist={watchlist}
            marketInsight={marketInsight}
            refreshing={refreshing}
            onRefresh={refresh}
            onOpenDetail={handleOpenDetail}
            onQuickAddWatch={handleQuickAddWatch}
          />
        )
      ) : null}

      {/* v2.1: 친구 모의투자 (Trading League). 상세/거래 모달은 Phase G+ */}
      {!loading && !error && activeTab === 'league' ? (
        <LeagueTab
          key={leagueRefreshTick}
          authToken={user?.token ?? null}
          refreshing={refreshing}
          onOpenLeague={(id) => setActiveLeagueId(id)}
          onCreateLeague={() => setCreateLeagueOpen(true)}
          onJoinedLeague={() => setLeagueRefreshTick((t) => t + 1)}
          toast={toast}
        />
      ) : null}

      {/* v2.2: 리딩 (종목·시황 콜 공유). 작성 모달은 overlays */}
      {!loading && !error && activeTab === 'reading' ? (
        <ReadingTab
          authToken={user?.token ?? null}
          refreshing={refreshing}
          refreshTick={readingRefreshTick}
          onCompose={() => setComposeOpen(true)}
          toast={toast}
        />
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
        onSaveWatchAlerts={handleSaveWatchAlerts}
        onSavePortfolio={handleSavePortfolio}
        onDeletePortfolio={(id) => void handleDeletePortfolio(id)}
      />
      <ReminderSettingsModal
        visible={reminderOpen}
        authToken={user?.token ?? null}
        onClose={() => setReminderOpen(false)}
      />
      <V2MigrationModal
        visible={v2MigrationOpen}
        currentPreference={marketPreference}
        onConfirm={(p) => void handleV2MigrationConfirm(p)}
        onClose={() => {
          setV2MigrationOpen(false)
          void markV2MigrationShown()
        }}
      />
      <CreateLeagueModal
        visible={createLeagueOpen}
        onClose={() => setCreateLeagueOpen(false)}
        onCreated={(id) => {
          setLeagueRefreshTick((t) => t + 1)
          setActiveLeagueId(id)  // 만든 직후 바로 상세 진입
        }}
        toast={toast}
      />
      <LeagueDetailModal
        visible={!!activeLeagueId}
        leagueId={activeLeagueId}
        myUserId={user?.userId}
        onClose={() => setActiveLeagueId(null)}
        toast={toast}
      />
      <ComposePostModal
        visible={composeOpen}
        onClose={() => setComposeOpen(false)}
        onPublished={() => setReadingRefreshTick((t) => t + 1)}
        toast={toast}
      />
      <SettingsModal
        visible={settingsOpen}
        user={user}
        marketPreference={marketPreference}
        themeMode={mode}
        authToken={user?.token ?? null}
        onClose={() => setSettingsOpen(false)}
        onMarketPreferenceChange={handleMarketPreferenceChange}
        onThemeChange={(m) => setMode(m)}
        onOpenReminder={() => setReminderOpen(true)}
        onLogout={() => { setSettingsOpen(false); confirmLogout() }}
      />
      <DailyGreetingModal
        visible={greetingOpen}
        fortune={fortune ?? null}
        onClose={() => setGreetingOpen(false)}
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
          onLogout={confirmLogout}
          onOpenReminder={() => { void hapticLight(); setReminderOpen(true) }}
          onOpenSettings={() => { void hapticLight(); setSettingsOpen(true) }}
          marketPreference={marketPreference}
          onMarketPreferenceChange={handleMarketPreferenceChange}
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
              {/* v2.1: 종/Sun/로그아웃 3개 → 톱니 1개 (통합 설정 모달 진입) */}
              <Pressable
                onPress={() => { void hapticLight(); setSettingsOpen(true) }}
                style={({ pressed }) => [styles.themeToggleBtn, pressed && { opacity: 0.6 }]}
                accessibilityLabel="설정"
              >
                <SettingsIcon size={16} color={palette.inkSub} />
              </Pressable>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, gap: 8 }}>
            {/* v2: 시장 선호 inline 토글 — 항상 노출, 가장 자주 쓰는 설정 */}
            <MarketProfileChip
              value={marketPreference}
              onChange={handleMarketPreferenceChange}
            />
            <Text style={[styles.headerSubtitle, { flexShrink: 1, textAlign: 'right' }]}>
              {lastSyncedAt ? `${lastSyncedAt}` : '오늘 하루를 한 화면에서'}
            </Text>
          </View>
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
    <SafeAreaProvider>
      <ThemeProvider>
        <AppShell />
      </ThemeProvider>
    </SafeAreaProvider>
  )
}
