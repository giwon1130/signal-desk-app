import { memo, useMemo, useState } from 'react'
import { Platform, RefreshControl, ScrollView } from 'react-native'
import { useStyles } from '../styles'
import type {
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

  const sortedPositions = useMemo<HoldingPosition[]>(() => {
    const filtered = applyFilter(positions)
    if (sortKey === 'added') return filtered
    const arr = [...filtered]
    if (sortKey === 'profit') {
      arr.sort((a, b) => b.profitAmount - a.profitAmount)
    } else if (sortKey === 'change') {
      arr.sort((a, b) => b.profitRate - a.profitRate)
    } else if (sortKey === 'name') {
      arr.sort((a, b) => a.name.localeCompare(b.name))
    }
    return arr
  }, [positions, marketFilter, sortKey])

  const sortedWatchlist = useMemo<WatchItem[]>(() => {
    const filtered = applyFilter(watchlist)
    if (sortKey === 'added' || sortKey === 'profit') return filtered  // 'profit' 은 관심에 의미 없음 → added fallback
    const arr = [...filtered]
    if (sortKey === 'change') {
      arr.sort((a, b) => b.changeRate - a.changeRate)
    } else if (sortKey === 'name') {
      arr.sort((a, b) => a.name.localeCompare(b.name))
    }
    return arr
  }, [watchlist, marketFilter, sortKey])

  // sortedPositions 를 다시 PortfolioSummary 형태로 감싸기 — PortfolioSection 는 portfolio prop 받음.
  const sortedPortfolio = useMemo<PortfolioSummary | null>(() => {
    if (!portfolio) return null
    return { ...portfolio, positions: sortedPositions }
  }, [portfolio, sortedPositions])

  return (
    <ScrollView
      style={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={[styles.content, isWeb && styles.contentWeb]}
    >
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
        onOpenDetail={onOpenDetail}
        onDeleteFavorite={onDeleteFavorite}
        onDeleteAllFavorites={onDeleteAllFavorites}
        onStockSearchChange={onStockSearchChange}
      />
    </ScrollView>
  )
})
