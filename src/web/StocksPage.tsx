import { memo, useCallback, useMemo, useState } from 'react'
import { Text, View } from 'react-native'
import type { DisclosureItem, HoldingPosition, PortfolioSummary, StockMarketFilter, StockSearchResult, WatchItem } from '../types'
import { useTheme } from '../theme'
import { useLivePrices } from '../hooks/useLivePrices'
import { DisclosureCard } from '../tabs/today_parts/DisclosureCard'
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
  disclosures: DisclosureItem[]
  onStockSearchChange: (value: string) => void
  onStockMarketFilterChange: (filter: StockMarketFilter) => void
  onOpenDetail: (market: string, ticker: string, name?: string) => void
  onQuickAddWatch: (stock: StockSearchResult) => Promise<void>
  onDeleteFavorite: (id: string) => void
  onDeleteAllFavorites: () => void
}

// memo: AppShell 재렌더(다른 탭 상태 변화 등)에 끌려 다시 그리지 않도록.
export const StocksPage = memo(function StocksPage(props: Props) {
  const { palette } = useTheme()
  const {
    watchlist, portfolio, stockSearch, stockMarketFilter, stockResults, stockSearchLoading,
    favoriteDeletingId, bulkDeleting, disclosures,
    onStockSearchChange, onStockMarketFilterChange,
    onOpenDetail, onQuickAddWatch, onDeleteFavorite, onDeleteAllFavorites,
  } = props
  const positions: HoldingPosition[] = portfolio?.positions ?? []

  const [mode, setMode] = useState<Mode>(positions.length ? 'holdings' : watchlist.length ? 'watch' : 'search')
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

  // useCallback — 라이브 가격 5초 틱에도 참조가 안정돼야 DataRow memo 가 변경 없는 행을 건너뜀.
  // (togglingKey 는 사용자 토글 시에만 바뀌므로 틱 사이에는 안정.)
  const handleToggle = useCallback(async (row: Row) => {
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
    } catch {
      // 실패 토스트는 mutation 쪽에서 이미 노출 — 여기서 안 잡으면 unhandled rejection
    } finally {
      setTogglingKey('')
    }
  }, [togglingKey, onDeleteFavorite, onQuickAddWatch])

  const confirmBulkDelete = () => {
    if (bulkDeleting || watchlist.length < 2) return
    // 웹 전용 페이지 — RN Alert 버튼 onPress 가 동작하지 않으므로 window.confirm 사용.
    if (typeof window !== 'undefined' && window.confirm(`${watchlist.length}개 종목을 전부 해제할까요? 되돌릴 수 없습니다.`)) {
      onDeleteAllFavorites()
    }
  }

  return (
    <View style={{ gap: 14 }}>
      <Text style={{ color: palette.inkMuted, fontSize: 13, lineHeight: 21 }}>종목을 선택하면 차트와 상세 정보를 확인하고 보유 내역을 등록할 수 있습니다.</Text>
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
      {mode === 'holdings' ? <View style={{ padding: 14, borderRadius: 8, backgroundColor: palette.surfaceAlt, gap: 5 }}>
        <Text style={{ color: palette.ink, fontSize: 13, fontWeight: '600' }}>캡처 등록은 모바일 앱에서</Text>
        <Text style={{ color: palette.inkMuted, fontSize: 12, lineHeight: 19 }}>앱의 내 종목 → 캡처 등록에서 잔고 화면을 가져올 수 있습니다. 종목과 수량을 확인해 저장하면 같은 계정의 웹에도 표시됩니다. 웹에서는 종목 상세에서 직접 입력해 주세요.</Text>
      </View> : null}
      <Text style={{ color: palette.inkFaint, fontSize: 11 }}>표가 화면보다 넓으면 좌우로 스크롤할 수 있습니다. 시세는 수집 시점에 따라 지연될 수 있습니다.</Text>
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
      {disclosures.length > 0 ? <DisclosureCard disclosures={disclosures} onOpenDetail={onOpenDetail} /> : null}
    </View>
  )
})
