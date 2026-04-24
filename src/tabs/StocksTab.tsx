import { useMemo, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native'
import { Plus, Radio, Search, Sparkles, Star, X } from 'lucide-react-native'
import { useStyles } from '../styles'
import { marketColor, useTheme } from '../theme'
import type {
  StockMarketFilter,
  StockSearchResult,
  WatchItem,
} from '../types'
import { formatCompactNumber, formatSignedRate } from '../utils'
import { useLivePrices } from '../hooks/useLivePrices'

type Props = {
  watchlist: WatchItem[]
  stockSearch: string
  stockMarketFilter: StockMarketFilter
  stockResults: StockSearchResult[]
  stockSearchLoading: boolean
  favoriteDeletingId: string
  refreshing: boolean
  onRefresh: () => Promise<void>
  onStockSearchChange: (value: string) => void
  onStockMarketFilterChange: (filter: StockMarketFilter) => void
  onOpenDetail: (market: string, ticker: string, name?: string) => void
  onQuickAddWatch: (stock: StockSearchResult) => Promise<void>
  onDeleteFavorite: (id: string) => void
}

export function StocksTab({
  watchlist,
  stockSearch,
  stockMarketFilter,
  stockResults,
  stockSearchLoading,
  favoriteDeletingId,
  refreshing,
  onRefresh,
  onStockSearchChange,
  onStockMarketFilterChange,
  onOpenDetail,
  onQuickAddWatch,
  onDeleteFavorite,
}: Props) {
  const styles = useStyles()
  const { palette } = useTheme()
  const [togglingKey, setTogglingKey] = useState('')

  const liveTickers = useMemo(() => {
    const set = new Set<string>()
    for (const r of stockResults) if (r.market === 'KR') set.add(r.ticker)
    for (const w of watchlist) if (w.market === 'KR') set.add(w.ticker)
    return Array.from(set)
  }, [stockResults, watchlist])
  const livePrices = useLivePrices(liveTickers)

  const liveOf = (market: string, ticker: string, fallbackPrice: number, fallbackRate: number) => {
    if (market !== 'KR') return { price: fallbackPrice, changeRate: fallbackRate, live: false }
    const lp = livePrices[ticker]
    return lp ? { price: lp.price, changeRate: lp.changeRate, live: true }
              : { price: fallbackPrice, changeRate: fallbackRate, live: false }
  }

  const findWatchItem = (market: string, ticker: string) =>
    watchlist.find((w) => w.market === market && w.ticker === ticker)

  const handleToggleWatch = async (stock: StockSearchResult) => {
    const key = `${stock.market}:${stock.ticker}`
    if (togglingKey) return
    setTogglingKey(key)
    try {
      const existing = findWatchItem(stock.market, stock.ticker)
      if (existing?.id) {
        // ⚠️ await 없으면 setTogglingKey('') 가 delete+refetch 보다 먼저 끝나서
        // UI 가 "해제 안 된 것처럼" 보임 → 사용자가 다시 눌러서 중복 등록됨.
        await onDeleteFavorite(existing.id)
      } else {
        await onQuickAddWatch(stock)
      }
    } finally {
      setTogglingKey('')
    }
  }

  return (
    <ScrollView
      style={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.content}
    >
      {/* ── 종목 탐색 ── */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.cardTitleRow}>
            <Search size={14} color="#3b82f6" strokeWidth={2.5} />
            <Text style={styles.cardTitle}>종목 탐색</Text>
          </View>
          <Text style={styles.metaText}>
            {stockSearchLoading ? '검색 중...' : `${stockResults.length}개`}
          </Text>
        </View>
        <TextInput
          value={stockSearch}
          onChangeText={onStockSearchChange}
          placeholder="종목명, 티커, 섹터 검색"
          placeholderTextColor="#94a3b8"
          style={styles.searchInput}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <View style={styles.filterRow}>
          {(['ALL', 'KR', 'US'] as const).map((filter) => (
            <Pressable
              key={filter}
              onPress={() => onStockMarketFilterChange(filter)}
              style={[styles.filterChip, stockMarketFilter === filter && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, stockMarketFilter === filter && styles.filterTextActive]}>
                {filter === 'ALL' ? '전체' : filter === 'KR' ? '🇰🇷 한국' : '🇺🇸 미국'}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={[styles.metaText, { marginTop: 4 }]}>
          카드를 탭하면 상세 모달, 우측 + 버튼은 한 번에 관심종목에 담기
        </Text>
        <View style={styles.stockResultRow}>
          {stockResults.map((item) => {
            const isInWatch = !!findWatchItem(item.market, item.ticker)
            return (
              <Pressable
                key={`${item.market}:${item.ticker}`}
                onPress={() => onOpenDetail(item.market, item.ticker, item.name)}
                style={styles.stockResultCard}
              >
                <View style={styles.stockResultTop}>
                  <Text style={styles.stockResultName}>{item.name}</Text>
                  <Text
                    style={[
                      styles.stockMarketBadge,
                      item.market === 'KR' ? styles.stockMarketBadgeKr : styles.stockMarketBadgeUs,
                    ]}
                  >
                    {item.market}
                  </Text>
                </View>
                <Text style={styles.stockResultMeta}>{item.ticker} · {item.sector}</Text>
                {(() => {
                  const live = liveOf(item.market, item.ticker, item.price, item.changeRate)
                  return (
                    <View style={styles.stockResultBottom}>
                      <View style={styles.cardTitleRow}>
                        <Text style={styles.stockResultPrice}>{formatCompactNumber(live.price)}</Text>
                        {live.live ? <Radio size={10} color="#10b981" strokeWidth={2.5} /> : null}
                      </View>
                      <Text style={[styles.stockResultDelta, { color: marketColor(palette, item.market, live.changeRate) }]}>
                        {formatSignedRate(live.changeRate)}
                      </Text>
                    </View>
                  )
                })()}
                <Pressable
                  onPress={() => void handleToggleWatch(item)}
                  hitSlop={8}
                  style={[styles.quickAddPill, isInWatch && styles.quickAddPillActive]}
                >
                  {isInWatch ? (
                    <>
                      <X size={11} color={palette.teal} strokeWidth={3} />
                      <Text style={styles.quickAddPillTextActive}>해제</Text>
                    </>
                  ) : (
                    <>
                      <Plus size={11} color="#ffffff" strokeWidth={3} />
                      <Text style={styles.quickAddPillText}>관심종목</Text>
                    </>
                  )}
                </Pressable>
              </Pressable>
            )
          })}
        </View>
      </View>

      {/* ── 내 관심종목 ── */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.cardTitleRow}>
            <Star size={14} color="#f59e0b" strokeWidth={2.5} fill={watchlist.length ? '#f59e0b' : 'none'} />
            <Text style={styles.cardTitle}>내 관심종목</Text>
          </View>
          <Text style={styles.metaText}>{watchlist.length}개</Text>
        </View>
        {watchlist.length ? (
          watchlist.map((item) => (
            <View key={`${item.market}-${item.ticker}-${item.id}`} style={styles.favoriteRow}>
              <Pressable
                onPress={() => onOpenDetail(item.market, item.ticker, item.name)}
                style={styles.metricLeft}
              >
                <Text style={styles.metricName}>{item.name}</Text>
                <Text style={styles.metricState}>{item.market} · {item.ticker} · {item.sector}</Text>
                <Text style={styles.cardNote}>{item.stance}</Text>
              </Pressable>
              <Pressable
                onPress={() => item.id && onDeleteFavorite(item.id)}
                style={styles.favoriteDeleteButton}
              >
                <Text style={styles.favoriteDeleteText}>
                  {favoriteDeletingId === item.id ? '...' : '해제'}
                </Text>
              </Pressable>
            </View>
          ))
        ) : (
          <View style={{ alignItems: 'center', gap: 10, paddingVertical: 24 }}>
            <View style={{
              width: 56, height: 56, borderRadius: 28,
              backgroundColor: palette.orangeSoft,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles size={26} color={palette.orange} strokeWidth={2.2} />
            </View>
            <Text style={{ color: palette.ink, fontSize: 14, fontWeight: '800' }}>
              아직 관심종목이 없어
            </Text>
            <Text style={{ color: palette.inkMuted, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
              위에서 종목 검색 후 + 버튼을 한 번 누르면{'\n'}바로 관심종목으로 담겨.
            </Text>
            <Pressable
              onPress={() => onStockSearchChange('')}
              style={({ pressed }) => [
                {
                  marginTop: 6, borderRadius: 999,
                  backgroundColor: palette.blue,
                  paddingHorizontal: 18, paddingVertical: 9,
                  flexDirection: 'row', gap: 6, alignItems: 'center',
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Search size={13} color="#ffffff" strokeWidth={2.5} />
              <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '800' }}>종목 탐색하기</Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  )
}
