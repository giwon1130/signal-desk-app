import { useMemo, useState } from 'react'
import { Alert, View } from 'react-native'
import type { HoldingPosition, PortfolioSummary, StockMarketFilter, StockSearchResult, WatchItem } from '../types'
import { useTheme } from '../theme'
import { useLivePrices } from '../hooks/useLivePrices'
import { Toolbar, type Mode } from './stockspage_parts/Toolbar'
import { DataTable, type Row } from './stockspage_parts/DataTable'
import type { SortKey, SortDir } from './stockspage_parts/HeaderCell'

/**
 * 웹 전용 종목 페이지 — Phase 3.
 *
 * 정렬 가능한 데이터 테이블. 검색/관심/보유 3-mode toggle.
 * 컴포넌트 분해: Toolbar + DataTable (+ HeaderCell).
 */

type Props = {
  watchlist: WatchItem[]
  portfolio: PortfolioSummary | null
  stockSearch: string
  stockMarketFilter: StockMarketFilter
  stockResults: StockSearchResult[]
  stockSearchLoading: boolean
  favoriteDeletingId: string
  bulkDeleting: boolean
  onStockSearchChange: (value: string) => void
  onStockMarketFilterChange: (filter: StockMarketFilter) => void
  onOpenDetail: (market: string, ticker: string, name?: string) => void
  onQuickAddWatch: (stock: StockSearchResult) => Promise<void>
  onDeleteFavorite: (id: string) => void
  onDeleteAllFavorites: () => void
}

export function StocksPage(props: Props) {
  const { palette } = useTheme()
  const {
    watchlist, portfolio, stockSearch, stockMarketFilter, stockResults, stockSearchLoading,
    favoriteDeletingId, bulkDeleting,
    onStockSearchChange, onStockMarketFilterChange,
    onOpenDetail, onQuickAddWatch, onDeleteFavorite, onDeleteAllFavorites,
  } = props
  const positions: HoldingPosition[] = portfolio?.positions ?? []

  const [mode, setMode] = useState<Mode>('search')
  const [sortKey, setSortKey] = useState<SortKey>('changeRate')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [togglingKey, setTogglingKey] = useState('')

  // 실시간 시세 구독 대상
  const liveTickers = useMemo(() => {
    const set = new Set<string>()
    for (const r of stockResults) if (r.market === 'KR') set.add(r.ticker)
    for (const w of watchlist)    if (w.market === 'KR') set.add(w.ticker)
    for (const p of positions)    if (p.market === 'KR') set.add(p.ticker)
    return Array.from(set)
  }, [stockResults, watchlist, positions])
  const livePrices = useLivePrices(liveTickers)

  const watchIndex = useMemo(() => {
    const m = new Map<string, WatchItem>()
    for (const w of watchlist) m.set(`${w.market}:${w.ticker}`, w)
    return m
  }, [watchlist])

  const rows: Row[] = useMemo(() => {
    if (mode === 'watch') {
      return watchlist.map((w): Row => {
        const lp = w.market === 'KR' ? livePrices[w.ticker] : null
        return {
          id: w.id,
          market: w.market,
          ticker: w.ticker,
          name: w.name,
          sector: w.sector,
          stance: w.stance,
          price: lp?.price ?? w.price,
          changeRate: lp?.changeRate ?? w.changeRate,
          isInWatch: true,
          watchId: w.id,
        }
      })
    }
    if (mode === 'holdings') {
      return positions.map((p): Row => {
        const lp = p.market === 'KR' ? livePrices[p.ticker] : null
        const livePrice = lp?.price ?? p.currentPrice
        const profitRate = p.buyPrice === 0 ? p.profitRate : ((livePrice - p.buyPrice) / p.buyPrice) * 100
        const profitAmount = (livePrice - p.buyPrice) * p.quantity
        const evaluationAmount = livePrice * p.quantity
        const watch = watchIndex.get(`${p.market}:${p.ticker}`)
        return {
          id: p.id,
          market: p.market,
          ticker: p.ticker,
          name: p.name,
          sector: '',
          stance: '',
          price: livePrice,
          changeRate: lp?.changeRate ?? 0,
          isInWatch: !!watch,
          watchId: watch?.id,
          holding: {
            buyPrice: p.buyPrice,
            quantity: p.quantity,
            profitRate,
            profitAmount,
            evaluationAmount,
          },
        }
      })
    }
    return stockResults.map((s): Row => {
      const lp = s.market === 'KR' ? livePrices[s.ticker] : null
      const watch = watchIndex.get(`${s.market}:${s.ticker}`)
      return {
        market: s.market,
        ticker: s.ticker,
        name: s.name,
        sector: s.sector,
        stance: s.stance,
        price: lp?.price ?? s.price,
        changeRate: lp?.changeRate ?? s.changeRate,
        isInWatch: !!watch,
        watchId: watch?.id,
      }
    })
  }, [mode, stockResults, watchlist, positions, livePrices, watchIndex])

  const sorted = useMemo(() => {
    const arr = [...rows]
    arr.sort((a, b) => {
      const sign = sortDir === 'asc' ? 1 : -1
      switch (sortKey) {
        case 'name':       return sign * a.name.localeCompare(b.name, 'ko-KR')
        case 'market':     return sign * a.market.localeCompare(b.market)
        case 'sector':     return sign * (a.sector ?? '').localeCompare(b.sector ?? '', 'ko-KR')
        case 'price':      return sign * (a.price - b.price)
        case 'changeRate': return sign * (a.changeRate - b.changeRate)
        case 'profitRate': return sign * ((a.holding?.profitRate ?? 0) - (b.holding?.profitRate ?? 0))
        case 'evaluation': return sign * ((a.holding?.evaluationAmount ?? 0) - (b.holding?.evaluationAmount ?? 0))
      }
    })
    return arr
  }, [rows, sortKey, sortDir])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir(key === 'name' || key === 'market' || key === 'sector' ? 'asc' : 'desc') }
  }

  const handleToggle = async (row: Row) => {
    const key = `${row.market}:${row.ticker}`
    if (togglingKey) return
    setTogglingKey(key)
    try {
      if (row.isInWatch && row.watchId) {
        await onDeleteFavorite(row.watchId)
      } else {
        await onQuickAddWatch({
          market: row.market,
          ticker: row.ticker,
          name: row.name,
          sector: row.sector,
          price: row.price,
          changeRate: row.changeRate,
        } as StockSearchResult)
      }
    } finally {
      setTogglingKey('')
    }
  }

  const confirmBulkDelete = () => {
    if (bulkDeleting || watchlist.length < 2) return
    Alert.alert(
      '관심종목 전체 해제',
      `${watchlist.length}개 종목을 전부 해제할까? 되돌릴 수 없어.`,
      [
        { text: '취소', style: 'cancel' },
        { text: '전체 해제', style: 'destructive', onPress: () => onDeleteAllFavorites() },
      ],
    )
  }

  return (
    <View style={{ gap: 14 }}>
      <Toolbar
        mode={mode}
        onModeChange={setMode}
        watchlistCount={watchlist.length}
        positionsCount={positions.length}
        stockSearch={stockSearch}
        stockMarketFilter={stockMarketFilter}
        stockSearchLoading={stockSearchLoading}
        stockResultsCount={stockResults.length}
        onStockSearchChange={onStockSearchChange}
        onStockMarketFilterChange={onStockMarketFilterChange}
        onConfirmBulkDelete={confirmBulkDelete}
        bulkDeleting={bulkDeleting}
        palette={palette}
      />
      <DataTable
        mode={mode}
        rows={sorted}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
        onOpenDetail={onOpenDetail}
        onToggleWatch={handleToggle}
        togglingKey={togglingKey}
        favoriteDeletingId={favoriteDeletingId}
        livePrices={livePrices}
        stockSearch={stockSearch}
        stockSearchLoading={stockSearchLoading}
        palette={palette}
      />
    </View>
  )
}
