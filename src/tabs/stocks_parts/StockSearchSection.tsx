import { useState, type RefObject } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { Plus, Radio, Search, X } from 'lucide-react-native'
import { useStyles } from '../../styles'
import { marketColor, useTheme } from '../../theme'
import type { StockMarketFilter, StockSearchResult, WatchItem } from '../../types'
import { formatPrice, formatSignedRate } from '../../utils'
import { PriceFlash } from '../../components/effects'

type LiveOf = (market: string, ticker: string, fallbackPrice: number, fallbackRate: number) =>
  { price: number; changeRate: number; live: boolean }

type Props = {
  stockSearch: string
  stockMarketFilter: StockMarketFilter
  stockResults: StockSearchResult[]
  stockSearchLoading: boolean
  watchlist: WatchItem[]
  onStockSearchChange: (value: string) => void
  onStockMarketFilterChange: (filter: StockMarketFilter) => void
  onOpenDetail: (market: string, ticker: string, name?: string) => void
  onQuickAddWatch: (stock: StockSearchResult) => Promise<void>
  onDeleteFavorite: (id: string) => Promise<void> | void
  liveOf: LiveOf
  cardFull?: boolean
  inputRef?: RefObject<TextInput | null>
}

export function StockSearchSection({
  stockSearch,
  stockMarketFilter,
  stockResults,
  stockSearchLoading,
  watchlist,
  onStockSearchChange,
  onStockMarketFilterChange,
  onOpenDetail,
  onQuickAddWatch,
  onDeleteFavorite,
  liveOf,
  cardFull,
  inputRef,
}: Props) {
  const styles = useStyles()
  const { palette } = useTheme()
  const [togglingKey, setTogglingKey] = useState('')

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
    <View style={[styles.card, cardFull && styles.cardFull]}>
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
        ref={inputRef}
        value={stockSearch}
        onChangeText={onStockSearchChange}
        placeholder="종목명, 티커, 섹터 검색 (예: 삼성, AAPL)"
        placeholderTextColor="#94a3b8"
        style={styles.searchInput}
        autoCapitalize="none"
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
          const live = liveOf(item.market, item.ticker, item.price, item.changeRate)
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
              <View style={styles.stockResultBottom}>
                <View style={styles.cardTitleRow}>
                  <PriceFlash value={live.live ? live.price : null} upColor={palette.up} downColor={palette.down}>
                    <Text style={styles.stockResultPrice}>{formatPrice(live.price, item.market)}</Text>
                  </PriceFlash>
                  {live.live ? <Radio size={10} color="#10b981" strokeWidth={2.5} /> : null}
                </View>
                <Text style={[styles.stockResultDelta, { color: marketColor(palette, item.market, live.changeRate) }]}>
                  {formatSignedRate(live.changeRate)}
                </Text>
              </View>
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
  )
}
