import { useEffect, useMemo, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native'
import { Briefcase, Check, Cpu, Info, Plus, Radio, Search, Sparkles, Star, X } from 'lucide-react-native'
import { useStyles } from '../styles'
import { marketColor, useTheme } from '../theme'
import type {
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
  favoriteDeletingId: string
  refreshing: boolean
  onRefresh: () => Promise<void>
  onStockSearchChange: (value: string) => void
  onStockMarketFilterChange: (filter: StockMarketFilter) => void
  onSelectedStockKeyChange: (key: string) => void
  onQuickAddWatch: (stock: StockSearchResult) => Promise<void>
  onDeleteFavorite: (id: string) => void
  onSavePortfolio: (payload: {
    id?: string
    market: string
    ticker: string
    name: string
    buyPrice: number
    currentPrice: number
    quantity: number
  }) => Promise<void>
  onDeletePortfolio: (id: string) => void
}

export function StocksTab({
  watchlist,
  stockSearch,
  stockMarketFilter,
  stockResults,
  stockSearchLoading,
  selectedStockKey,
  selectedStock,
  favoriteDeletingId,
  refreshing,
  onRefresh,
  onStockSearchChange,
  onStockMarketFilterChange,
  onSelectedStockKeyChange,
  onQuickAddWatch,
  onDeleteFavorite,
  onSavePortfolio,
  onDeletePortfolio,
}: Props) {
  const styles = useStyles()
  const { palette } = useTheme()
  const [togglingKey, setTogglingKey] = useState('')
  const [buyPriceInput, setBuyPriceInput] = useState('')
  const [quantityInput, setQuantityInput] = useState('')
  const [portfolioSaving, setPortfolioSaving] = useState(false)

  // 종목 변경 시 폼을 기존 보유 데이터로 채움 (없으면 비움)
  useEffect(() => {
    const pos = selectedStock?.portfolioPosition
    setBuyPriceInput(pos ? String(pos.buyPrice) : '')
    setQuantityInput(pos ? String(pos.quantity) : '')
  }, [selectedStock?.portfolioPosition?.id, selectedStockKey])

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

  const findWatchItem = (market: string, ticker: string) =>
    watchlist.find((w) => w.market === market && w.ticker === ticker)

  const handleToggleWatch = async (stock: StockSearchResult) => {
    const key = `${stock.market}:${stock.ticker}`
    if (togglingKey) return
    setTogglingKey(key)
    try {
      const existing = findWatchItem(stock.market, stock.ticker)
      if (existing?.id) {
        onDeleteFavorite(existing.id)
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
          카드를 탭하면 상세, 우측 + 버튼은 한 번에 관심종목에 담기
        </Text>
        <View style={styles.stockResultRow}>
          {stockResults.map((item) => {
            const stockKey = `${item.market}:${item.ticker}`
            const isSelected = selectedStockKey === stockKey
            const isInWatch = !!findWatchItem(item.market, item.ticker)
            return (
              <Pressable
                key={stockKey}
                onPress={() => onSelectedStockKeyChange(stockKey)}
                style={[styles.stockResultCard, isSelected && styles.stockResultCardActive]}
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
              <Text style={styles.kpiLabel}>관심종목</Text>
              <Text style={[styles.quickStatValue, { color: selectedStock.watchItem ? '#0d9488' : '#94a3b8' }]}>
                {selectedStock.watchItem ? '담김' : '미등록'}
              </Text>
              <Text style={styles.metaText}>{selectedStock.watchItem ? '추적 중' : '아래 버튼으로 추가'}</Text>
            </View>
            <View style={styles.quickStatCard}>
              <Text style={styles.kpiLabel}>실제 보유 (포트폴리오)</Text>
              <Text style={[styles.quickStatValue, { color: selectedStock.portfolioPosition ? '#dc2626' : '#94a3b8' }]}>
                {selectedStock.portfolioPosition ? '보유' : '미보유'}
              </Text>
              <Text style={styles.metaText}>
                {selectedStock.portfolioPosition
                  ? `${selectedStock.portfolioPosition.quantity}주 · ${formatSignedRate(selectedStock.portfolioPosition.profitRate)}`
                  : '실제 보유한 종목만 여기 잡혀'}
              </Text>
            </View>
          </View>

          {/* 한 탭으로 관심종목 토글 */}
          <Pressable
            onPress={() => void handleToggleWatch(selectedStock.base)}
            style={[styles.quickAddPill, !!selectedStock.watchItem && styles.quickAddPillActive, { alignSelf: 'stretch', justifyContent: 'center', paddingVertical: 12, marginTop: 8 }]}
          >
            {selectedStock.watchItem ? (
              <>
                <X size={14} color={palette.teal} strokeWidth={3} />
                <Text style={[styles.quickAddPillTextActive, { fontSize: 13 }]}>
                  관심종목에서 해제
                </Text>
              </>
            ) : (
              <>
                <Plus size={14} color="#ffffff" strokeWidth={3} />
                <Text style={[styles.quickAddPillText, { fontSize: 13 }]}>관심종목에 담기</Text>
              </>
            )}
          </Pressable>

          {/* ── 실제 보유(포트폴리오) 등록/수정 ── */}
          <View style={styles.cardSection}>
            <View style={styles.cardTitleRow}>
              <Briefcase size={13} color="#3b82f6" strokeWidth={2.5} />
              <Text style={styles.cardTitle}>
                {selectedStock.portfolioPosition ? '실제 보유 종목 수정' : '실제 보유 종목으로 등록'}
              </Text>
            </View>
            <Text style={styles.metaText}>
              매수가와 수량만 입력하면 손익률·평가금액 자동 계산
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.kpiLabel}>매수가</Text>
                <TextInput
                  value={buyPriceInput}
                  onChangeText={setBuyPriceInput}
                  placeholder="예: 84200"
                  placeholderTextColor="#94a3b8"
                  style={styles.searchInput}
                  keyboardType="number-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.kpiLabel}>수량</Text>
                <TextInput
                  value={quantityInput}
                  onChangeText={setQuantityInput}
                  placeholder="예: 10"
                  placeholderTextColor="#94a3b8"
                  style={styles.searchInput}
                  keyboardType="number-pad"
                />
              </View>
            </View>
            <View style={styles.inlineButtonRow}>
              <Pressable
                onPress={async () => {
                  const buy = Number(buyPriceInput.replace(/[^0-9]/g, ''))
                  const qty = Number(quantityInput.replace(/[^0-9]/g, ''))
                  if (!buy || !qty) return
                  setPortfolioSaving(true)
                  try {
                    const live = liveOf(selectedStock.base.market, selectedStock.base.ticker, selectedStock.base.price, selectedStock.base.changeRate)
                    await onSavePortfolio({
                      id: selectedStock.portfolioPosition?.id,
                      market: selectedStock.base.market,
                      ticker: selectedStock.base.ticker,
                      name: selectedStock.base.name,
                      buyPrice: buy,
                      currentPrice: Math.round(live.price || selectedStock.base.price),
                      quantity: qty,
                    })
                  } catch {} finally {
                    setPortfolioSaving(false)
                  }
                }}
                style={styles.primaryActionButton}
              >
                <Text style={styles.primaryActionButtonText}>
                  {portfolioSaving
                    ? '저장 중...'
                    : selectedStock.portfolioPosition
                      ? '수정 저장'
                      : '보유 등록'}
                </Text>
              </Pressable>
              {selectedStock.portfolioPosition?.id ? (
                <Pressable
                  onPress={() => onDeletePortfolio(selectedStock.portfolioPosition!.id)}
                  style={styles.secondaryActionButton}
                >
                  <Text style={styles.secondaryActionButtonText}>삭제</Text>
                </Pressable>
              ) : null}
            </View>
            {selectedStock.portfolioPosition ? (
              <Text style={styles.metaText}>
                현재 평가금액 {formatCompactNumber(selectedStock.portfolioPosition.evaluationAmount)} ·
                손익 {formatSignedRate(selectedStock.portfolioPosition.profitRate)}
              </Text>
            ) : null}
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
                onPress={() => {
                  onStockMarketFilterChange(item.market as StockMarketFilter)
                  onStockSearchChange(item.ticker)
                  onSelectedStockKeyChange(`${item.market}:${item.ticker}`)
                }}
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
