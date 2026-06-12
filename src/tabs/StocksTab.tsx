import { memo, useMemo, useRef, useState } from 'react'
import { Platform, RefreshControl, ScrollView, TextInput } from 'react-native'
import { Briefcase } from 'lucide-react-native'
import { useStyles } from '../styles'
import { useTheme } from '../theme'
import { TabIntro } from '../components/guide/TabIntro'
import type {
  DisclosureItem,
  HoldingPosition,
  PortfolioSummary,
  StockMarketFilter,
  StockSearchResult,
  WatchItem,
} from '../types'
import { useLivePrices } from '../hooks/useLivePrices'
import { PortfolioSection } from './stocks_parts/PortfolioSection'
import { StockSearchSection } from './stocks_parts/StockSearchSection'
import { WatchlistSection } from './stocks_parts/WatchlistSection'
import { DisclosureCard } from './today_parts/DisclosureCard'
import {
  WorkspaceFilterBar,
  type WorkspaceMarketFilter,
  type WorkspaceSortKey,
} from './stocks_parts/WorkspaceFilterBar'

type Props = {
  watchlist: WatchItem[]
  portfolio: PortfolioSummary | null
  stockSearch: string
  stockMarketFilter: StockMarketFilter
  stockResults: StockSearchResult[]
  stockSearchLoading: boolean
  favoriteDeletingId: string
  bulkDeleting: boolean
  /** 보유/관심 KR 종목 공시 — '내 종목 소식'이라 종목 탭에 위치 (오늘 탭에서 이동). */
  disclosures: DisclosureItem[]
  refreshing: boolean
  onRefresh: () => Promise<void>
  onStockSearchChange: (value: string) => void
  onStockMarketFilterChange: (filter: StockMarketFilter) => void
  onOpenDetail: (market: string, ticker: string, name?: string) => void
  onQuickAddWatch: (stock: StockSearchResult) => Promise<void>
  onDeleteFavorite: (id: string) => Promise<void> | void
  onDeleteAllFavorites: () => void
}

// memo: AppShell 재렌더(다른 탭 상태 변화 등)에 끌려 다시 그리지 않도록.
export const StocksTab = memo(function StocksTab({
  watchlist,
  portfolio,
  stockSearch,
  stockMarketFilter,
  stockResults,
  stockSearchLoading,
  favoriteDeletingId,
  bulkDeleting,
  disclosures,
  refreshing,
  onRefresh,
  onStockSearchChange,
  onStockMarketFilterChange,
  onOpenDetail,
  onQuickAddWatch,
  onDeleteFavorite,
  onDeleteAllFavorites,
}: Props) {
  const styles = useStyles()
  const { palette } = useTheme()
  const positions = portfolio?.positions ?? []
  const isWeb = Platform.OS === 'web'

  // v2: 보유/관심 공통 정렬·필터 (Spec 결정 6)
  const [sortKey, setSortKey] = useState<WorkspaceSortKey>('added')
  const [marketFilter, setMarketFilter] = useState<WorkspaceMarketFilter>('ALL')

  // KR 종목 라이브 시세는 검색결과/관심/보유 어디 등장하든 한 번에 fetch.
  const liveTickers = useMemo(() => {
    const set = new Set<string>()
    for (const r of stockResults) if (r.market === 'KR') set.add(r.ticker)
    for (const w of watchlist) if (w.market === 'KR') set.add(w.ticker)
    for (const p of positions) if (p.market === 'KR') set.add(p.ticker)
    return Array.from(set)
  }, [stockResults, watchlist, positions])
  const livePrices = useLivePrices(liveTickers)

  // US 종목은 라이브 미지원 → fallback 그대로. KR 만 live 매핑.
  const liveOf = (market: string, ticker: string, fallbackPrice: number, fallbackRate: number) => {
    if (market !== 'KR') return { price: fallbackPrice, changeRate: fallbackRate, live: false }
    const lp = livePrices[ticker]
    return lp ? { price: lp.price, changeRate: lp.changeRate, live: true }
              : { price: fallbackPrice, changeRate: fallbackRate, live: false }
  }

  // ── 정렬·필터 적용 ──
  // marketFilter: ALL/KR/US 로 필터링.
  // sortKey: 'profit'(보유 한정 의미) / 'change' / 'name' / 'added'(원본 순서).
  const applyFilter = <T extends { market: string }>(items: T[]) =>
    marketFilter === 'ALL' ? items : items.filter((it) => it.market === marketFilter)

  // 정렬·합계는 PortfolioSection 행과 같은 라이브 값으로 계산해야 화면과 일치한다.
  // (기존엔 저장된 profitAmount/profitRate 로 정렬 → 라이브 시세와 어긋났음)
  const liveProfitOf = (p: HoldingPosition) => {
    const live = liveOf(p.market, p.ticker, p.currentPrice, 0).price
    const profitAmount = (live - p.buyPrice) * p.quantity
    const profitRate = p.buyPrice > 0 ? ((live - p.buyPrice) / p.buyPrice) * 100 : p.profitRate
    return { profitAmount, profitRate }
  }

  const sortedPositions = useMemo<HoldingPosition[]>(() => {
    const filtered = applyFilter(positions)
    if (sortKey === 'added') return filtered
    const arr = [...filtered]
    if (sortKey === 'profit') {
      arr.sort((a, b) => liveProfitOf(b).profitAmount - liveProfitOf(a).profitAmount)
    } else if (sortKey === 'change') {
      arr.sort((a, b) => liveProfitOf(b).profitRate - liveProfitOf(a).profitRate)
    } else if (sortKey === 'name') {
      arr.sort((a, b) => a.name.localeCompare(b.name))
    }
    return arr
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions, marketFilter, sortKey, livePrices])

  const sortedWatchlist = useMemo<WatchItem[]>(() => {
    const filtered = applyFilter(watchlist)
    if (sortKey === 'added' || sortKey === 'profit') return filtered  // 'profit' 은 관심에 의미 없음 → added fallback
    const arr = [...filtered]
    if (sortKey === 'change') {
      const rateOf = (w: WatchItem) => liveOf(w.market, w.ticker, w.price, w.changeRate).changeRate
      arr.sort((a, b) => rateOf(b) - rateOf(a))
    } else if (sortKey === 'name') {
      arr.sort((a, b) => a.name.localeCompare(b.name))
    }
    return arr
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchlist, marketFilter, sortKey, livePrices])

  // sortedPositions 를 다시 PortfolioSummary 형태로 감싸기 — PortfolioSection 는 portfolio prop 받음.
  const sortedPortfolio = useMemo<PortfolioSummary | null>(() => {
    if (!portfolio) return null
    return { ...portfolio, positions: sortedPositions }
  }, [portfolio, sortedPositions])

  // 관심종목 빈 상태 "종목 탐색하기" → 상단으로 스크롤 + 검색창 포커스 (기존엔 no-op 이었음).
  const scrollRef = useRef<ScrollView>(null)
  const searchRef = useRef<TextInput>(null)
  const focusSearch = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true })
    setTimeout(() => searchRef.current?.focus(), 250)
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={[styles.content, isWeb && styles.contentWeb]}
    >
      {/* 탭 인트로 — 컴팩트 타이틀, 처음 몇 번만 펼친 설명 */}
      <TabIntro
        tabKey="stocks"
        icon={Briefcase}
        title="종목"
        tagline="보유·관심 종목을 한 곳에서 관리"
        description="종목을 검색해 관심목록에 담거나 보유 내역을 기록하면, 실시간 손익과 보유 종목 관련 공시까지 함께 추적돼요. 정렬·필터로 원하는 순서대로 볼 수 있습니다."
        accent={palette.brandAccent}
      />

      <StockSearchSection
        stockSearch={stockSearch}
        stockMarketFilter={stockMarketFilter}
        stockResults={stockResults}
        stockSearchLoading={stockSearchLoading}
        watchlist={watchlist}
        onStockSearchChange={onStockSearchChange}
        onStockMarketFilterChange={onStockMarketFilterChange}
        onOpenDetail={onOpenDetail}
        onQuickAddWatch={onQuickAddWatch}
        onDeleteFavorite={onDeleteFavorite}
        liveOf={liveOf}
        cardFull={isWeb}
        inputRef={searchRef}
      />
      {/* 보유/관심 공통 정렬·필터 (Spec 결정 6) */}
      <WorkspaceFilterBar
        sortKey={sortKey}
        marketFilter={marketFilter}
        onSortChange={setSortKey}
        onMarketFilterChange={setMarketFilter}
      />
      <PortfolioSection
        portfolio={sortedPortfolio}
        liveOf={liveOf}
        onOpenDetail={onOpenDetail}
      />
      <WatchlistSection
        watchlist={sortedWatchlist}
        favoriteDeletingId={favoriteDeletingId}
        bulkDeleting={bulkDeleting}
        liveOf={liveOf}
        onOpenDetail={onOpenDetail}
        onDeleteFavorite={onDeleteFavorite}
        onDeleteAllFavorites={onDeleteAllFavorites}
        onStockSearchChange={onStockSearchChange}
        onFocusSearch={focusSearch}
      />
      {/* ── 보유/관심 종목 공시 (DART) — 오늘 탭에서 이동 ── */}
      <DisclosureCard disclosures={disclosures} onOpenDetail={onOpenDetail} />
    </ScrollView>
  )
})
