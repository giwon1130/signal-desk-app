import { Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native'
import { styles } from '../styles'
import type {
  AiRecommendationData,
  BuyDraft,
  FavoriteDraft,
  LogFilter,
  RecommendationExecutionLog,
  SelectedStockSnapshot,
  StockMarketFilter,
  StockSearchResult,
  WatchItem,
} from '../types'
import { formatCompactNumber, formatSignedRate, getLogReturnColor } from '../utils'

type SellSignalLevel = 'STRONG_SELL' | 'CAUTION' | 'TAKE_PROFIT' | 'HOLD'

function classifySellSignal(profitRate: number): { level: SellSignalLevel; emoji: string; label: string } {
  if (profitRate <= -8.0) return { level: 'STRONG_SELL', emoji: '🔴', label: `손실 ${formatSignedRate(profitRate)} — 손절 기준 초과` }
  if (profitRate <= -5.0) return { level: 'CAUTION', emoji: '🟡', label: `손실 ${formatSignedRate(profitRate)} — 손절 검토 필요` }
  if (profitRate >= 10.0) return { level: 'TAKE_PROFIT', emoji: '💰', label: `수익 ${formatSignedRate(profitRate)} — 목표 수익 달성` }
  if (profitRate >= 5.0) return { level: 'TAKE_PROFIT', emoji: '💰', label: `수익 ${formatSignedRate(profitRate)} — 익절 검토 구간` }
  return { level: 'HOLD', emoji: '🟢', label: `이상 없음 (${formatSignedRate(profitRate)})` }
}

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
  buyDraft: BuyDraft
  portfolioSaving: boolean
  portfolioDeletingId: string
  aiRecommendation: AiRecommendationData | null
  filteredLogs: RecommendationExecutionLog[]
  logFilter: LogFilter
  logQuery: string
  recommendLogs: number
  resultLogs: number
  refreshing: boolean
  onRefresh: () => Promise<void>
  onStockSearchChange: (value: string) => void
  onStockMarketFilterChange: (filter: StockMarketFilter) => void
  onSelectedStockKeyChange: (key: string) => void
  onFavoriteDraftChange: (draft: FavoriteDraft) => void
  onSaveFavorite: () => void
  onDeleteFavorite: (id: string) => void
  onBuyDraftChange: (draft: BuyDraft) => void
  onSavePortfolio: () => void
  onDeletePortfolio: (id: string) => void
  onLogFilterChange: (filter: LogFilter) => void
  onLogQueryChange: (value: string) => void
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
  buyDraft,
  portfolioSaving,
  portfolioDeletingId,
  aiRecommendation,
  filteredLogs,
  logFilter,
  logQuery,
  recommendLogs,
  resultLogs,
  refreshing,
  onRefresh,
  onStockSearchChange,
  onStockMarketFilterChange,
  onSelectedStockKeyChange,
  onFavoriteDraftChange,
  onSaveFavorite,
  onDeleteFavorite,
  onBuyDraftChange,
  onSavePortfolio,
  onDeletePortfolio,
  onLogFilterChange,
  onLogQueryChange,
}: Props) {
  return (
    <ScrollView
      style={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.content}
    >
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.cardTitle}>종목 탐색</Text>
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
                {filter === 'ALL' ? '전체' : filter === 'KR' ? '한국' : '미국'}
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
                  <Text style={styles.stockResultPrice}>{formatCompactNumber(item.price)}</Text>
                  <Text style={[styles.stockResultDelta, { color: item.changeRate >= 0 ? '#dc2626' : '#2563eb' }]}>
                    {formatSignedRate(item.changeRate)}
                  </Text>
                </View>
                {isFavorite ? <Text style={styles.favoriteHint}>즐겨찾기 등록됨</Text> : null}
              </Pressable>
            )
          })}
        </View>
      </View>

      {selectedStock ? (
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.cardTitle}>종목 상세</Text>
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
              <Text style={styles.quickStatValue}>{selectedStock.watchItem ? 'ON' : 'OFF'}</Text>
              <Text style={styles.metaText}>{selectedStock.watchItem?.note ?? '아직 등록 안 됨'}</Text>
            </View>
            <View style={styles.quickStatCard}>
              <Text style={styles.kpiLabel}>보유 상태</Text>
              <Text style={styles.quickStatValue}>{selectedStock.portfolioPosition ? '보유' : '미보유'}</Text>
              <Text style={styles.metaText}>
                {selectedStock.portfolioPosition
                  ? `${selectedStock.portfolioPosition.quantity}주 · ${formatSignedRate(selectedStock.portfolioPosition.profitRate)}`
                  : '포트폴리오 없음'}
              </Text>
            </View>
          </View>

          {selectedStock.portfolioPosition ? (() => {
            const sig = classifySellSignal(selectedStock.portfolioPosition.profitRate)
            const pos = selectedStock.portfolioPosition
            return (
              <View style={[styles.cardSection, { borderLeftWidth: 3, borderLeftColor: sig.level === 'STRONG_SELL' ? '#dc2626' : sig.level === 'CAUTION' ? '#d97706' : sig.level === 'TAKE_PROFIT' ? '#16a34a' : '#2563eb', paddingLeft: 10 }]}>
                <Text style={styles.cardTitle}>매도 분석</Text>
                <Text style={[styles.quickStatValue, { marginBottom: 4 }]}>{sig.emoji} {sig.label}</Text>
                <Text style={styles.metaText}>
                  매수가 {formatCompactNumber(pos.buyPrice)} → 현재 {formatCompactNumber(pos.currentPrice)} · {pos.quantity}주 · 평가손익 {pos.profitAmount >= 0 ? '+' : ''}{formatCompactNumber(pos.profitAmount)}원
                </Text>
                <Pressable
                  onPress={() => onDeletePortfolio(pos.id)}
                  style={[styles.secondaryActionButton, { marginTop: 8, alignSelf: 'flex-start' }]}
                >
                  <Text style={styles.secondaryActionButtonText}>
                    {portfolioDeletingId === pos.id ? '삭제 중...' : '기록 삭제'}
                  </Text>
                </Pressable>
              </View>
            )
          })() : null}

          <View style={styles.cardSection}>
            <Text style={styles.cardTitle}>매수 기록</Text>
            <Text style={styles.metaText}>현재가 {formatCompactNumber(selectedStock.base.price)}</Text>
            <TextInput
              value={buyDraft.buyPrice}
              onChangeText={(value) => onBuyDraftChange({ ...buyDraft, buyPrice: value })}
              placeholder="매수가 (원)"
              placeholderTextColor="#94a3b8"
              style={styles.searchInput}
              keyboardType="numeric"
            />
            <TextInput
              value={buyDraft.quantity}
              onChangeText={(value) => onBuyDraftChange({ ...buyDraft, quantity: value })}
              placeholder="수량 (주)"
              placeholderTextColor="#94a3b8"
              style={styles.searchInput}
              keyboardType="numeric"
            />
            <Pressable onPress={onSavePortfolio} style={styles.primaryActionButton}>
              <Text style={styles.primaryActionButtonText}>
                {portfolioSaving ? '저장 중...' : selectedStock.portfolioPosition ? '매수 기록 수정' : '매수 기록'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.cardSection}>
            <Text style={styles.cardTitle}>즐겨찾기 편집</Text>
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
              <Text style={styles.cardTitle}>최근 AI 로그</Text>
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

      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.cardTitle}>내 즐겨찾기</Text>
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
          <Text style={styles.metaText}>아직 즐겨찾기가 없어. 종목 탭에서 추가해.</Text>
        )}
      </View>

      <View style={styles.primaryCard}>
        <Text style={styles.cardEyebrow}>AI BRIEF</Text>
        <Text style={styles.primaryValue}>{aiRecommendation?.generatedDate ?? '-'}</Text>
        <Text style={styles.cardNote}>{aiRecommendation?.summary ?? '-'}</Text>
      </View>

      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>전체 로그</Text>
          <Text style={styles.kpiValue}>{aiRecommendation?.executionLogs.length ?? 0}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>추천 로그</Text>
          <Text style={styles.kpiValue}>{recommendLogs}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>성과 로그</Text>
          <Text style={styles.kpiValue}>{resultLogs}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.filterRow}>
          {(['ALL', 'RECOMMEND', 'RESULT'] as const).map((filter) => (
            <Pressable
              key={filter}
              onPress={() => onLogFilterChange(filter)}
              style={[styles.filterChip, logFilter === filter && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, logFilter === filter && styles.filterTextActive]}>
                {filter === 'ALL' ? '전체' : filter === 'RECOMMEND' ? '추천' : '성과'}
              </Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          value={logQuery}
          onChangeText={onLogQueryChange}
          placeholder="AI 로그 검색: 종목명, 티커, 상태"
          placeholderTextColor="#94a3b8"
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {filteredLogs.length ? (
          filteredLogs.map((item) => (
            <View key={`${item.date}-${item.market}-${item.ticker}-${item.stage}`} style={styles.cardSection}>
              <View style={styles.logTop}>
                <Text style={styles.logName}>{item.name} ({item.market} {item.ticker})</Text>
                <Text style={styles.logStage}>{item.stage}</Text>
              </View>
              <Text style={styles.logMeta}>{item.date} · {item.status}</Text>
              <Text style={styles.cardNote}>{item.rationale}</Text>
              <View style={styles.logBadges}>
                {item.confidence != null ? <Text style={styles.badge}>신뢰도 {item.confidence}</Text> : null}
                {item.expectedReturnRate != null ? (
                  <Text style={styles.badge}>예상 {formatSignedRate(item.expectedReturnRate)}</Text>
                ) : null}
                <Text style={[styles.badge, { color: getLogReturnColor(item.realizedReturnRate) }]}>
                  실현 {formatSignedRate(item.realizedReturnRate)}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.metaText}>표시할 로그가 없어.</Text>
        )}
      </View>
    </ScrollView>
  )
}
