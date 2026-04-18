import { useMemo } from 'react'
import { Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native'
import { Bookmark, BookmarkCheck, Cpu, Info, Radio, Search, Sparkles, Star } from 'lucide-react-native'
import { useStyles } from '../styles'
import { marketColor, useTheme } from '../theme'
import type {
  FavoriteDraft,
  SelectedStockSnapshot,
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
  selectedStockKey: string
  selectedStock: SelectedStockSnapshot | null
  favoriteDraft: FavoriteDraft
  favoriteSaving: boolean
  favoriteDeletingId: string
  refreshing: boolean
  onRefresh: () => Promise<void>
  onStockSearchChange: (value: string) => void
  onStockMarketFilterChange: (filter: StockMarketFilter) => void
  onSelectedStockKeyChange: (key: string) => void
  onFavoriteDraftChange: (draft: FavoriteDraft) => void
  onSaveFavorite: () => void
  onDeleteFavorite: (id: string) => void
}

export function StocksTab({
  watchlist,
  stockSearch,
  stockMarketFilter,
  stockResults,
  stockSearchLoading,
  selectedStockKey,
  selectedStock,
  favoriteDraft,
  favoriteSaving,
  favoriteDeletingId,
  refreshing,
  onRefresh,
  onStockSearchChange,
  onStockMarketFilterChange,
  onSelectedStockKeyChange,
  onFavoriteDraftChange,
  onSaveFavorite,
  onDeleteFavorite,
}: Props) {
  const styles = useStyles()
  const { palette } = useTheme()

  // 실시간 시세: 검색 결과 + 즐겨찾기의 KR 종목을 한 번에 구독
  const liveTickers = useMemo(() => {
    const set = new Set<string>()
    for (const r of stockResults) if (r.market === 'KR') set.add(r.ticker)
    for (const w of watchlist) if (w.market === 'KR') set.add(w.ticker)
    if (selectedStock?.base.market === 'KR') set.add(selectedStock.base.ticker)
    return Array.from(set)
  }, [stockResults, watchlist, selectedStock])
  const livePrices = useLivePrices(liveTickers)

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
        <View style={styles.stockResultRow}>
          {stockResults.map((item) => {
            const stockKey = `${item.market}:${item.ticker}`
            const isSelected = selectedStockKey === stockKey
            const isFavorite = watchlist.some(
              (watchItem) => watchItem.market === item.market && watchItem.ticker === item.ticker,
            )
            return (
              <Pressable
                key={stockKey}
                onPress={() => onSelectedStockKeyChange(stockKey)}
                style={[styles.stockResultCard, isSelected && styles.stockResultCardActive]}
              >
                <View style={styles.stockResultTop}>
                  <Text style={styles.stockResultName}>{item.name}</Text>
                  <View style={styles.cardTitleRow}>
                    {isFavorite ? (
                      <Star size={12} color="#0d9488" strokeWidth={2.5} fill="#0d9488" />
                    ) : null}
                    <Text
                      style={[
                        styles.stockMarketBadge,
                        item.market === 'KR' ? styles.stockMarketBadgeKr : styles.stockMarketBadgeUs,
                      ]}
                    >
                      {item.market}
                    </Text>
                  </View>
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
                {isFavorite ? (
                  <View style={styles.cardTitleRow}>
                    <BookmarkCheck size={11} color="#0d9488" strokeWidth={2.5} />
                    <Text style={styles.favoriteHint}>즐겨찾기 등록됨</Text>
                  </View>
                ) : null}
              </Pressable>
            )
          })}
        </View>
      </View>

      {/* ── 종목 상세 ── */}
      {selectedStock ? (
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.cardTitleRow}>
              <Info size={14} color="#6366f1" strokeWidth={2.5} />
              <Text style={styles.cardTitle}>종목 상세</Text>
            </View>
            <Text style={styles.metaText}>{selectedStock.base.market} · {selectedStock.base.ticker}</Text>
          </View>
          <View style={styles.stockDetailHero}>
            <View style={styles.metricLeft}>
              <Text style={styles.stockDetailName}>{selectedStock.base.name}</Text>
              <Text style={styles.metricState}>{selectedStock.base.sector}</Text>
            </View>
            {(() => {
              const live = liveOf(selectedStock.base.market, selectedStock.base.ticker, selectedStock.base.price, selectedStock.base.changeRate)
              return (
                <View style={styles.summaryValueBox}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.stockDetailPrice}>{formatCompactNumber(live.price)}</Text>
                    {live.live ? <Radio size={12} color="#10b981" strokeWidth={2.5} /> : null}
                  </View>
                  <Text
                    style={[
                      styles.summaryDelta,
                      { color: marketColor(palette, selectedStock.base.market, live.changeRate) },
                    ]}
                  >
                    {formatSignedRate(live.changeRate)}
                  </Text>
                </View>
              )
            })()}
          </View>
          <Text style={styles.cardNote}>{selectedStock.base.stance}</Text>

          <View style={styles.quickStatsRow}>
            <View style={styles.quickStatCard}>
              <Text style={styles.kpiLabel}>즐겨찾기</Text>
              <Text style={[styles.quickStatValue, { color: selectedStock.watchItem ? '#0d9488' : '#94a3b8' }]}>
                {selectedStock.watchItem ? 'ON' : 'OFF'}
              </Text>
              <Text style={styles.metaText}>{selectedStock.watchItem?.note ?? '아직 등록 안 됨'}</Text>
            </View>
            <View style={styles.quickStatCard}>
              <Text style={styles.kpiLabel}>보유 상태</Text>
              <Text style={[styles.quickStatValue, { color: selectedStock.portfolioPosition ? '#dc2626' : '#94a3b8' }]}>
                {selectedStock.portfolioPosition ? '보유' : '미보유'}
              </Text>
              <Text style={styles.metaText}>
                {selectedStock.portfolioPosition
                  ? `${selectedStock.portfolioPosition.quantity}주 · ${formatSignedRate(selectedStock.portfolioPosition.profitRate)}`
                  : '포트폴리오 없음'}
              </Text>
            </View>
          </View>

          <View style={styles.cardSection}>
            <View style={styles.cardTitleRow}>
              <Bookmark size={13} color="#3b82f6" strokeWidth={2.5} />
              <Text style={styles.cardTitle}>즐겨찾기 편집</Text>
            </View>
            <TextInput
              value={favoriteDraft.stance}
              onChangeText={(value) => onFavoriteDraftChange({ ...favoriteDraft, stance: value })}
              placeholder="관점"
              placeholderTextColor="#94a3b8"
              style={styles.searchInput}
            />
            <TextInput
              value={favoriteDraft.note}
              onChangeText={(value) => onFavoriteDraftChange({ ...favoriteDraft, note: value })}
              placeholder="메모"
              placeholderTextColor="#94a3b8"
              style={[styles.searchInput, styles.noteInput]}
              multiline
            />
            <View style={styles.inlineButtonRow}>
              <Pressable onPress={onSaveFavorite} style={styles.primaryActionButton}>
                <Text style={styles.primaryActionButtonText}>
                  {favoriteSaving ? '저장 중...' : selectedStock.watchItem ? '즐겨찾기 수정' : '즐겨찾기 추가'}
                </Text>
              </Pressable>
              {selectedStock.watchItem?.id ? (
                <Pressable
                  onPress={() => onDeleteFavorite(selectedStock.watchItem!.id)}
                  style={styles.secondaryActionButton}
                >
                  <Text style={styles.secondaryActionButtonText}>
                    {favoriteDeletingId === selectedStock.watchItem.id ? '삭제 중...' : '삭제'}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          {selectedStock.latestAiLog ? (
            <View style={styles.cardSection}>
              <View style={styles.cardTitleRow}>
                <Cpu size={13} color="#7c3aed" strokeWidth={2.5} />
                <Text style={styles.cardTitle}>최근 AI 로그</Text>
              </View>
              <View style={styles.stockInsightCard}>
                <Text style={styles.logMeta}>
                  {selectedStock.latestAiLog.date} · {selectedStock.latestAiLog.stage} · {selectedStock.latestAiLog.status}
                </Text>
                <Text style={styles.cardNote}>{selectedStock.latestAiLog.rationale}</Text>
              </View>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* ── 내 즐겨찾기 ── */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.cardTitleRow}>
            <Star size={14} color="#f59e0b" strokeWidth={2.5} fill={watchlist.length ? '#f59e0b' : 'none'} />
            <Text style={styles.cardTitle}>내 즐겨찾기</Text>
          </View>
          <Text style={styles.metaText}>{watchlist.length}개</Text>
        </View>
        {watchlist.length ? (
          watchlist.map((item) => (
            <View key={`${item.market}-${item.ticker}-${item.id}`} style={styles.favoriteRow}>
              <Pressable
                onPress={() => {
                  onStockMarketFilterChange(item.market as StockMarketFilter)
                  onStockSearchChange(item.ticker)
                  onSelectedStockKeyChange(`${item.market}:${item.ticker}`)
                }}
                style={styles.metricLeft}
              >
                <Text style={styles.metricName}>{item.name}</Text>
                <Text style={styles.metricState}>{item.market} · {item.ticker} · {item.sector}</Text>
                <Text style={styles.cardNote}>{item.note}</Text>
              </Pressable>
              <Pressable
                onPress={() => item.id && onDeleteFavorite(item.id)}
                style={styles.favoriteDeleteButton}
              >
                <Text style={styles.favoriteDeleteText}>
                  {favoriteDeletingId === item.id ? '...' : '삭제'}
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
              아직 즐겨찾기가 비어있어
            </Text>
            <Text style={{ color: palette.inkMuted, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
              관심 가는 종목을 검색해서{'\n'}별표로 저장해두면 한눈에 추적할 수 있어.
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
