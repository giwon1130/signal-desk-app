import { Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native'
import { Bookmark, BookmarkCheck, Cpu, Info, Search, Star } from 'lucide-react-native'
import { styles } from '../styles'
import type {
  FavoriteDraft,
  SelectedStockSnapshot,
  StockMarketFilter,
  StockSearchResult,
  WatchItem,
} from '../types'
import { formatCompactNumber, formatSignedRate } from '../utils'

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
                <View style={styles.stockResultBottom}>
                  <Text style={styles.stockResultPrice}>{formatCompactNumber(item.price)}</Text>
                  <Text style={[styles.stockResultDelta, { color: item.changeRate >= 0 ? '#dc2626' : '#2563eb' }]}>
                    {formatSignedRate(item.changeRate)}
                  </Text>
                </View>
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
            <View style={styles.summaryValueBox}>
              <Text style={styles.stockDetailPrice}>{formatCompactNumber(selectedStock.base.price)}</Text>
              <Text
                style={[
                  styles.summaryDelta,
                  { color: selectedStock.base.changeRate >= 0 ? '#dc2626' : '#2563eb' },
                ]}
              >
                {formatSignedRate(selectedStock.base.changeRate)}
              </Text>
            </View>
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
          <View style={styles.emptyStateRow}>
            <Star size={14} color="#94a3b8" strokeWidth={2} />
            <Text style={styles.metaText}>아직 즐겨찾기가 없어. 위에서 종목을 검색해 추가해.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  )
}
