import { ScrollView, View, useWindowDimensions } from 'react-native'
import type { ReactNode } from 'react'
import { useTheme } from '../theme'
import { hapticLight } from '../utils/haptics'
import type {
  AiRecommendationData,
  MarketSectionsData,
  PortfolioSummary,
  TabKey,
  WatchItem,
} from '../types'
import { WebFooter } from '../components/WebFooter'
import { TickerRibbon } from './TickerRibbon'
import { ContextSidebar, CONTEXT_SIDEBAR_WIDTH } from './ContextSidebar'
import { TradingDayBanner } from './layout_parts/TradingDayBanner'
import { MainHeader } from './layout_parts/MainHeader'
import { NarrowHeader } from './layout_parts/NarrowHeader'
import { NarrowTabBar } from './layout_parts/NarrowTabBar'
import { LeftSidebar } from './layout_parts/LeftSidebar'

/**
 * 웹 전용 셸 — 3차 고도화 (Phase 1).
 *
 * 구조:
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │  TickerRibbon (고정, 지수 live)                             │  ← 어느 탭이든 항상 보임
 *   ├──────┬───────────────────────────────────┬──────────────────┤
 *   │ Nav  │  Main (탭 컨텐츠)                 │ ContextSidebar   │  ← 관심종목/포트폴리오/알림
 *   │ 220px│  flex 1, ScrollView               │ 300px            │
 *   └──────┴───────────────────────────────────┴──────────────────┘
 *
 * 폭별 동작:
 *   - ≥1280px : 사이드바 + 메인 + 컨텍스트 (full desktop)
 *   - 960 ~ 1280 : 사이드바 + 메인 (컨텍스트 숨김)
 *   - <960 : 상단 탭바 + 메인 (기존 모바일 폴백)
 *
 * 모바일 셸은 App.tsx 의 Platform.OS !== 'web' 브랜치가 담당.
 */

const SIDEBAR_WIDTH = 220
const CONTEXT_BREAKPOINT = 1280
const NARROW_BREAKPOINT  = 960

type Props = {
  user: { nickname?: string | null; email?: string | null } | null
  activeTab: TabKey
  isUp: boolean
  lastSyncedAt: string
  onTabChange: (key: TabKey) => void
  onLogout: () => void
  onOpenReminder: () => void
  // Phase 1 에서 추가: 글로벌 컨텍스트를 위한 데이터
  sections: MarketSectionsData | null
  summary?: import('../types').MarketSummaryData | null
  fortune?: import('../types').DailyFortune | null
  watchlist: WatchItem[]
  portfolio: PortfolioSummary | null
  aiRecommendation: AiRecommendationData | null
  onOpenDetail: (market: string, ticker: string, name?: string) => void
  children: ReactNode
}

export function WebLayout(props: Props) {
  const {
    user, activeTab, isUp, lastSyncedAt,
    onTabChange, onLogout, onOpenReminder,
    sections, summary, fortune, watchlist, portfolio, aiRecommendation, onOpenDetail,
    children,
  } = props
  const sessions = summary?.marketSessions ?? null
  const { palette, toggle } = useTheme()
  const { width } = useWindowDimensions()
  const isNarrow     = width < NARROW_BREAKPOINT
  const showContext  = width >= CONTEXT_BREAKPOINT
  const isDark = palette.scheme === 'dark'
  const handleToggleTheme = () => { void hapticLight(); toggle() }

  /* ───── 좁은 뷰포트 (상단 탭 바) ───── */
  if (isNarrow) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg }}>
        <TickerRibbon
          sections={sections}
          sessions={sessions}
          onClickIndex={() => onTabChange('market')}
        />
        <NarrowHeader
          isUp={isUp}
          lastSyncedAt={lastSyncedAt}
          onOpenReminder={onOpenReminder}
          onToggleTheme={handleToggleTheme}
          onLogout={onLogout}
          isDark={isDark}
        />
        <NarrowTabBar activeTab={activeTab} onTabChange={onTabChange} />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
          <View style={{ paddingHorizontal: 14, paddingTop: 10, gap: 12 }}>
            {summary?.tradingDayStatus ? <TradingDayBanner status={summary.tradingDayStatus} /> : null}
            {children}
          </View>
          <WebFooter />
        </ScrollView>
      </View>
    )
  }

  /* ───── 넓은 뷰포트 (풀 데스크톱) ───── */
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* 상단 티커 리본 — 어느 탭에 있든 고정 */}
      <TickerRibbon
        sections={sections}
        sessions={sessions}
        onClickIndex={() => onTabChange('market')}
      />

      <View style={{ flex: 1, flexDirection: 'row' }}>
        <LeftSidebar
          width={SIDEBAR_WIDTH}
          user={user}
          activeTab={activeTab}
          isUp={isUp}
          lastSyncedAt={lastSyncedAt}
          isDark={isDark}
          onTabChange={onTabChange}
          onOpenReminder={onOpenReminder}
          onToggleTheme={handleToggleTheme}
          onLogout={onLogout}
        />

        {/* ── 메인 컨텐츠 (flex 1, 최대 폭 없이 꽉 채움) ── */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ minHeight: '100%' }}
        >
          <View style={{
            width: '100%',
            paddingHorizontal: 24,
            paddingVertical: 20,
            gap: 16,
            // 아주 큰 모니터(1800+) 에서도 가독성 위해 상한 1440 캡.
            // showContext=false 구간에선 좀 더 좁게 (1200).
            maxWidth: showContext ? 1440 : 1200,
            alignSelf: 'center',
          }}>
            <MainHeader activeTab={activeTab} lastSyncedAt={lastSyncedAt} />
            {summary?.tradingDayStatus ? <TradingDayBanner status={summary.tradingDayStatus} /> : null}
            {children}
          </View>
          <WebFooter />
        </ScrollView>

        {/* ── 우측 컨텍스트 사이드바 ──────────────────── */}
        {showContext ? (
          <ContextSidebar
            watchlist={watchlist}
            portfolio={portfolio}
            aiRecommendation={aiRecommendation}
            fortune={fortune ?? null}
            onOpenDetail={onOpenDetail}
            onGotoStocks={() => onTabChange('stocks')}
            onGotoAi={() => onTabChange('ai')}
          />
        ) : null}
      </View>
    </View>
  )
}

export { CONTEXT_SIDEBAR_WIDTH }
