import { useMemo, useState } from 'react'
import { Alert, Platform, Pressable, Text, TextInput, View } from 'react-native'
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Minus,
  Plus,
  Radio,
  Search,
  Star,
  Trash2,
  X,
} from 'lucide-react-native'
import type { StockMarketFilter, StockSearchResult, WatchItem } from '../types'
import { marketColor, useTheme, type Palette } from '../theme'
import { formatCompactNumber, formatSignedRate } from '../utils'
import { useLivePrices } from '../hooks/useLivePrices'

/**
 * 웹 전용 종목 페이지 — Phase 3.
 *
 * 기존 StocksTab 의 "카드 타일 그리드" 를 버리고 정렬 가능한 데이터 테이블로 재설계.
 * Investing.com / Yahoo Finance 의 screener 와 Toss증권 웹 종목 리스트 참고.
 *
 * 특징:
 *   - 컬럼 헤더 클릭 → 정렬 (asc/desc 토글)
 *   - KR 티커는 WebSocket live price 표시 (☉ 표식)
 *   - 관심종목 on/off 토글 (☆/★)
 *   - "관심종목만 보기" 탭 ↔ "검색 결과 보기" 탭
 *   - 행 클릭 → 상세 모달
 */

type Props = {
  watchlist: WatchItem[]
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

type Mode = 'search' | 'watch'
type SortKey = 'name' | 'market' | 'sector' | 'price' | 'changeRate'
type SortDir = 'asc' | 'desc'

// 테이블에 공통으로 들어가는 row shape
type Row = {
  id?: string        // watchlist row 에만 존재
  market: string
  ticker: string
  name: string
  sector: string
  price: number
  changeRate: number
  isInWatch: boolean
  watchId?: string
}

export function StocksPage(props: Props) {
  const { palette } = useTheme()
  const {
    watchlist, stockSearch, stockMarketFilter, stockResults, stockSearchLoading,
    favoriteDeletingId, bulkDeleting,
    onStockSearchChange, onStockMarketFilterChange,
    onOpenDetail, onQuickAddWatch, onDeleteFavorite, onDeleteAllFavorites,
  } = props

  const [mode, setMode] = useState<Mode>('search')
  const [sortKey, setSortKey] = useState<SortKey>('changeRate')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [togglingKey, setTogglingKey] = useState('')

  // 실시간 시세 구독 대상 모으기
  const liveTickers = useMemo(() => {
    const set = new Set<string>()
    for (const r of stockResults) if (r.market === 'KR') set.add(r.ticker)
    for (const w of watchlist)    if (w.market === 'KR') set.add(w.ticker)
    return Array.from(set)
  }, [stockResults, watchlist])
  const livePrices = useLivePrices(liveTickers)

  const watchIndex = useMemo(() => {
    const m = new Map<string, WatchItem>()
    for (const w of watchlist) m.set(`${w.market}:${w.ticker}`, w)
    return m
  }, [watchlist])

  // 모드별 소스 → Row 로 정규화
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
          price: lp?.price ?? w.price,
          changeRate: lp?.changeRate ?? w.changeRate,
          isInWatch: true,
          watchId: w.id,
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
        price: lp?.price ?? s.price,
        changeRate: lp?.changeRate ?? s.changeRate,
        isInWatch: !!watch,
        watchId: watch?.id,
      }
    })
  }, [mode, stockResults, watchlist, livePrices, watchIndex])

  // 정렬
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
    // 네이티브 Alert.alert 은 웹에서 그대로 API 호환이라 OK
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
      {/* ── 검색 + 필터 + 모드 토글 ── */}
      <View style={{
        backgroundColor: palette.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: palette.border,
        padding: 12,
        gap: 10,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* 모드 탭 */}
          <View style={{ flexDirection: 'row', gap: 4, padding: 3, borderRadius: 8, backgroundColor: palette.surfaceAlt }}>
            {(['search', 'watch'] as const).map((m) => {
              const active = mode === m
              return (
                <Pressable
                  key={m}
                  onPress={() => setMode(m)}
                  style={(state) => {
                    const hovered = (state as { hovered?: boolean }).hovered
                    return [{
                      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6,
                      backgroundColor: active ? palette.surface : (hovered ? palette.border : 'transparent'),
                      borderWidth: active ? 1 : 0, borderColor: palette.border,
                      flexDirection: 'row', alignItems: 'center', gap: 5,
                    }]
                  }}
                >
                  {m === 'watch' ? (
                    <Star size={11} color={active ? '#f59e0b' : palette.inkSub}
                      strokeWidth={2.5} fill={active ? '#f59e0b' : 'none'} />
                  ) : (
                    <Search size={11} color={active ? palette.blue : palette.inkSub} strokeWidth={2.5} />
                  )}
                  <Text style={{
                    color: active ? palette.ink : palette.inkSub,
                    fontSize: 12, fontWeight: '800',
                  }}>
                    {m === 'search' ? '종목 탐색' : `관심종목 (${watchlist.length})`}
                  </Text>
                </Pressable>
              )
            })}
          </View>

          {/* 검색 */}
          {mode === 'search' ? (
            <View style={{ flex: 1, minWidth: 280, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{
                flex: 1,
                flexDirection: 'row', alignItems: 'center', gap: 8,
                paddingHorizontal: 12, paddingVertical: 8,
                borderRadius: 8, borderWidth: 1, borderColor: palette.border,
                backgroundColor: palette.bg,
              }}>
                <Search size={14} color={palette.inkMuted} strokeWidth={2.5} />
                <TextInput
                  value={stockSearch}
                  onChangeText={onStockSearchChange}
                  placeholder="종목명 · 티커 · 섹터 검색"
                  placeholderTextColor={palette.inkFaint}
                  style={{
                    flex: 1,
                    color: palette.ink,
                    fontSize: 13,
                    fontWeight: '600',
                    outlineStyle: 'none',
                  } as object}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
                {stockSearch ? (
                  <Pressable onPress={() => onStockSearchChange('')} hitSlop={8}>
                    <X size={13} color={palette.inkMuted} strokeWidth={2.5} />
                  </Pressable>
                ) : null}
              </View>

              {/* 마켓 필터 */}
              <View style={{ flexDirection: 'row', gap: 2, padding: 3, borderRadius: 8, backgroundColor: palette.surfaceAlt }}>
                {(['ALL', 'KR', 'US'] as const).map((f) => {
                  const active = stockMarketFilter === f
                  return (
                    <Pressable
                      key={f}
                      onPress={() => onStockMarketFilterChange(f)}
                      style={{
                        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6,
                        backgroundColor: active ? palette.surface : 'transparent',
                        borderWidth: active ? 1 : 0, borderColor: palette.border,
                      }}
                    >
                      <Text style={{
                        color: active ? palette.ink : palette.inkMuted,
                        fontSize: 11, fontWeight: '800',
                      }}>
                        {f === 'ALL' ? '전체' : f === 'KR' ? '🇰🇷 한국' : '🇺🇸 미국'}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>

              <Text style={{ color: palette.inkMuted, fontSize: 11, fontWeight: '600', marginLeft: 4 }}>
                {stockSearchLoading ? '검색 중…' : `${stockResults.length}건`}
              </Text>
            </View>
          ) : (
            <>
              <View style={{ flex: 1 }} />
              {watchlist.length >= 2 ? (
                <Pressable
                  onPress={confirmBulkDelete}
                  disabled={bulkDeleting}
                  style={(state) => {
                    const hovered = (state as { hovered?: boolean }).hovered
                    return [{
                      flexDirection: 'row', alignItems: 'center', gap: 5,
                      paddingHorizontal: 12, paddingVertical: 7,
                      borderRadius: 7,
                      borderWidth: 1, borderColor: palette.red,
                      backgroundColor: hovered ? palette.redSoft : 'transparent',
                      opacity: bulkDeleting ? 0.5 : 1,
                    }]
                  }}
                >
                  <Trash2 size={12} color={palette.red} strokeWidth={2.5} />
                  <Text style={{ color: palette.red, fontSize: 11, fontWeight: '800' }}>
                    {bulkDeleting ? '해제 중…' : '전체 해제'}
                  </Text>
                </Pressable>
              ) : null}
            </>
          )}
        </View>
      </View>

      {/* ── 데이터 테이블 ── */}
      <View style={{
        backgroundColor: palette.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: palette.border,
        overflow: 'hidden',
      }}>
        {/* 헤더 */}
        <View style={[
          { flexDirection: 'row', paddingVertical: 9, paddingHorizontal: 12, gap: 8,
            borderBottomWidth: 1, borderBottomColor: palette.border,
            backgroundColor: palette.surfaceAlt },
        ]}>
          <HeaderCell width={34} label="" palette={palette} />
          <HeaderCell flex={2.4} label="종목명" sortable sortKey="name" currentKey={sortKey} currentDir={sortDir} onPress={handleSort} palette={palette} />
          <HeaderCell width={70}  label="티커" palette={palette} />
          <HeaderCell width={60}  label="시장" sortable sortKey="market" currentKey={sortKey} currentDir={sortDir} onPress={handleSort} palette={palette} />
          <HeaderCell flex={1.4}  label="섹터" sortable sortKey="sector" currentKey={sortKey} currentDir={sortDir} onPress={handleSort} palette={palette} />
          <HeaderCell width={110} label="현재가" align="right" sortable sortKey="price" currentKey={sortKey} currentDir={sortDir} onPress={handleSort} palette={palette} />
          <HeaderCell width={90}  label="등락률" align="right" sortable sortKey="changeRate" currentKey={sortKey} currentDir={sortDir} onPress={handleSort} palette={palette} />
          <HeaderCell width={48}  label="" palette={palette} />
        </View>

        {/* 바디 */}
        {sorted.length === 0 ? (
          <View style={{ paddingVertical: 40, alignItems: 'center', gap: 4 }}>
            <Text style={{ color: palette.inkMuted, fontSize: 13, fontWeight: '700' }}>
              {mode === 'watch' ? '아직 관심종목이 없어' : stockSearchLoading ? '검색 중…' : '검색 결과 없음'}
            </Text>
            {mode === 'watch' ? (
              <Text style={{ color: palette.inkFaint, fontSize: 11 }}>
                탐색 탭에서 ☆ 눌러 담아봐
              </Text>
            ) : null}
          </View>
        ) : (
          sorted.map((row, i) => {
            const isLive = row.market === 'KR' && !!livePrices[row.ticker]
            const color = marketColor(palette, row.market, row.changeRate)
            const toggling = togglingKey === `${row.market}:${row.ticker}` || favoriteDeletingId === row.watchId
            return (
              <Pressable
                key={`${row.market}-${row.ticker}-${i}`}
                onPress={() => onOpenDetail(row.market, row.ticker, row.name)}
                style={(state) => {
                  const hovered = (state as { hovered?: boolean }).hovered
                  return [{
                    flexDirection: 'row', alignItems: 'center',
                    paddingVertical: 9, paddingHorizontal: 12, gap: 8,
                    borderBottomWidth: 1, borderBottomColor: palette.border,
                    backgroundColor: hovered ? palette.surfaceAlt : 'transparent',
                  }]
                }}
              >
                {/* ☆ 토글 */}
                <Pressable
                  onPress={(e) => { (e as unknown as { stopPropagation: () => void }).stopPropagation?.(); void handleToggle(row) }}
                  hitSlop={6}
                  style={{ width: 34, alignItems: 'center' }}
                  disabled={toggling}
                >
                  <Star
                    size={14}
                    color={row.isInWatch ? '#f59e0b' : palette.inkFaint}
                    strokeWidth={2.5}
                    fill={row.isInWatch ? '#f59e0b' : 'none'}
                  />
                </Pressable>

                {/* 종목명 */}
                <View style={{ flex: 2.4, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Text
                    numberOfLines={1}
                    style={{ color: palette.ink, fontSize: 13, fontWeight: '800', flexShrink: 1 }}
                  >
                    {row.name}
                  </Text>
                  {isLive ? <Radio size={9} color="#10b981" strokeWidth={3} /> : null}
                </View>

                {/* 티커 */}
                <Text
                  style={{
                    width: 70,
                    color: palette.inkMuted,
                    fontSize: 12,
                    fontWeight: '600',
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {row.ticker}
                </Text>

                {/* 시장 */}
                <View style={{ width: 60 }}>
                  <View style={{
                    alignSelf: 'flex-start',
                    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
                    backgroundColor: row.market === 'KR' ? palette.blueSoft : palette.greenSoft,
                  }}>
                    <Text style={{
                      color: row.market === 'KR' ? palette.blue : palette.green,
                      fontSize: 10, fontWeight: '800', letterSpacing: 0.5,
                    }}>
                      {row.market}
                    </Text>
                  </View>
                </View>

                {/* 섹터 */}
                <Text
                  numberOfLines={1}
                  style={{
                    flex: 1.4, minWidth: 0,
                    color: palette.inkMuted, fontSize: 11, fontWeight: '600',
                  }}
                >
                  {row.sector || '—'}
                </Text>

                {/* 현재가 */}
                <Text
                  style={{
                    width: 110,
                    textAlign: 'right',
                    color: palette.ink, fontSize: 13, fontWeight: '800',
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {formatCompactNumber(row.price)}
                </Text>

                {/* 등락률 */}
                <View style={{ width: 90, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 3 }}>
                  {row.changeRate > 0 ? <ArrowUp size={10} color={color} strokeWidth={3} />
                    : row.changeRate < 0 ? <ArrowDown size={10} color={color} strokeWidth={3} />
                    : <Minus size={10} color={color} strokeWidth={3} />}
                  <Text style={{ color, fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
                    {formatSignedRate(row.changeRate)}
                  </Text>
                </View>

                {/* 액션 */}
                <View style={{ width: 48, alignItems: 'flex-end' }}>
                  <Pressable
                    onPress={(e) => { (e as unknown as { stopPropagation: () => void }).stopPropagation?.(); void handleToggle(row) }}
                    disabled={toggling}
                    style={(state) => {
                      const hovered = (state as { hovered?: boolean }).hovered
                      return [{
                        flexDirection: 'row', alignItems: 'center', gap: 3,
                        paddingHorizontal: 8, paddingVertical: 4,
                        borderRadius: 6,
                        backgroundColor: row.isInWatch
                          ? (hovered ? palette.redSoft : palette.surfaceAlt)
                          : (hovered ? palette.blueSoft : palette.blue),
                        opacity: toggling ? 0.5 : 1,
                      }]
                    }}
                  >
                    {row.isInWatch ? (
                      <>
                        <X size={9} color={palette.red} strokeWidth={3} />
                        <Text style={{ color: palette.red, fontSize: 10, fontWeight: '800' }}>해제</Text>
                      </>
                    ) : (
                      <>
                        <Plus size={9} color="#ffffff" strokeWidth={3} />
                        <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '800' }}>담기</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </Pressable>
            )
          })
        )}
      </View>
    </View>
  )
}

/* ── 헤더 셀 ─────────────────────────────────────────── */

function HeaderCell({
  label, width, flex, align, sortable, sortKey, currentKey, currentDir, onPress, palette,
}: {
  label: string
  width?: number
  flex?: number
  align?: 'left' | 'right'
  sortable?: boolean
  sortKey?: SortKey
  currentKey?: SortKey
  currentDir?: SortDir
  onPress?: (k: SortKey) => void
  palette: Palette
}) {
  const active = sortable && sortKey && sortKey === currentKey
  const content = (
    <View style={{
      flex, width,
      flexDirection: 'row', alignItems: 'center',
      justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
      gap: 3,
    }}>
      <Text style={{
        color: active ? palette.ink : palette.inkMuted,
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
      }}>
        {label}
      </Text>
      {sortable && sortKey ? (
        active
          ? (currentDir === 'asc'
              ? <ChevronUp size={10} color={palette.ink} strokeWidth={3} />
              : <ChevronDown size={10} color={palette.ink} strokeWidth={3} />)
          : <ChevronDown size={10} color={palette.inkFaint} strokeWidth={2.5} />
      ) : null}
    </View>
  )
  if (!sortable || !sortKey || !onPress) return content
  return (
    <Pressable
      onPress={() => onPress(sortKey)}
      style={(state) => {
        const hovered = (state as { hovered?: boolean }).hovered
        return [{
          flex, width,
          flexDirection: 'row', alignItems: 'center',
          justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
          gap: 3,
          paddingVertical: 2,
          borderRadius: 4,
          backgroundColor: hovered ? (Platform.OS === 'web' ? (palette.scheme === 'dark' ? '#243244' : '#e2e8f0') : 'transparent') : 'transparent',
        }]
      }}
    >
      <Text style={{
        color: active ? palette.ink : palette.inkMuted,
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
      }}>
        {label}
      </Text>
      {active
        ? (currentDir === 'asc'
            ? <ChevronUp size={10} color={palette.ink} strokeWidth={3} />
            : <ChevronDown size={10} color={palette.ink} strokeWidth={3} />)
        : <ChevronDown size={10} color={palette.inkFaint} strokeWidth={2.5} />}
    </Pressable>
  )
}
