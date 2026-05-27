import { useMemo } from 'react'
import { Platform, RefreshControl, ScrollView } from 'react-native'
import { useStyles } from '../styles'
import type {
  PortfolioSummary,
  StockMarketFilter,
  StockSearchResult,
  WatchItem,
} from '../types'
import { useLivePrices } from '../hooks/useLivePrices'
import { PortfolioSection } from './stocks_parts/PortfolioSection'
import { StockSearchSection } from './stocks_parts/StockSearchSection'
import { WatchlistSection } from './stocks_parts/WatchlistSection'

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

export function StocksTab({
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
      <PortfolioSection
        portfolio={portfolio}
        liveOf={liveOf}
        onOpenDetail={onOpenDetail}
      />
      <WatchlistSection
        watchlist={watchlist}
        favoriteDeletingId={favoriteDeletingId}
        bulkDeleting={bulkDeleting}
        onOpenDetail={onOpenDetail}
        onDeleteFavorite={onDeleteFavorite}
        onDeleteAllFavorites={onDeleteAllFavorites}
        onStockSearchChange={onStockSearchChange}
      />
    </ScrollView>
  )
}
