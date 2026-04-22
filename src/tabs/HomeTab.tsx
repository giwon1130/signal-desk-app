import { Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native'
import { Briefcase, Eye, Search, X } from 'lucide-react-native'
import { useStyles } from '../styles'
import type { HoldingPosition, PortfolioSummary, WatchItem } from '../types'
import { formatCompactNumber, formatSignedRate } from '../utils'

type Props = {
  watchlist: WatchItem[]
  portfolio: PortfolioSummary | null
  refreshing: boolean
  onRefresh: () => Promise<void>
  homeQuery: string
  onHomeQueryChange: (value: string) => void
  filteredWatchlist: WatchItem[]
  filteredPortfolioPositions: HoldingPosition[]
  topWatchlist: WatchItem[]
  topPortfolioPositions: HoldingPosition[]
  successRate: string
  onOpenDetail: (market: string, ticker: string, name?: string) => void
  onRemoveWatch: (id: string) => void
}

export function HomeTab({
  watchlist,
  portfolio,
  refreshing,
  onRefresh,
  homeQuery,
  onHomeQueryChange,
  filteredWatchlist,
  filteredPortfolioPositions,
  topWatchlist,
  topPortfolioPositions,
  successRate,
  onOpenDetail,
  onRemoveWatch,
}: Props) {
  const styles = useStyles()
  return (
    <ScrollView
      style={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.content}
    >
      {/* ── 히어로 KPI (정보용 — 탭 안 됨) ── */}
      <View style={styles.heroMetricsRow}>
        <View style={[styles.heroMetricCard, styles.heroMetricCardDark]}>
          <Text style={[styles.heroMetricLabel, styles.heroMetricLabelOnDark]}>AI 성공률</Text>
          <Text style={[styles.heroMetricValue, styles.heroMetricValueOnDark]}>{successRate}</Text>
          <Text style={[styles.heroMetricFootnote, styles.heroMetricFootnoteOnDark]}>최근 추천 적중률</Text>
        </View>
        <View style={styles.heroMetricCard}>
          <Text style={styles.heroMetricLabel}>관심종목</Text>
          <Text style={styles.heroMetricValue}>{watchlist.length}</Text>
          <Text style={styles.heroMetricFootnote}>추적 중인 종목 수</Text>
        </View>
        <View style={styles.heroMetricCard}>
          <Text style={styles.heroMetricLabel}>실제 보유</Text>
          <Text style={[styles.heroMetricValue, { color: (portfolio?.totalProfitRate ?? 0) >= 0 ? '#dc2626' : '#2563eb' }]}>
            {portfolio ? formatSignedRate(portfolio.totalProfitRate) : '-'}
          </Text>
          <Text style={styles.heroMetricFootnote}>{portfolio?.positions.length ?? 0}개 보유 · 누적 손익</Text>
        </View>
      </View>

      {/* ── 빠른 검색 ── */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.cardTitleRow}>
            <Search size={14} color="#3b82f6" strokeWidth={2.5} />
            <Text style={styles.cardTitle}>빠른 검색</Text>
          </View>
          <Text style={styles.metaText}>관심종목/보유종목</Text>
        </View>
        <TextInput
          value={homeQuery}
          onChangeText={onHomeQueryChange}
          placeholder="종목명, 티커, 시장으로 검색"
          placeholderTextColor="#94a3b8"
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <View style={styles.quickStatsRow}>
          <View style={styles.quickStatCard}>
            <Text style={styles.kpiLabel}>검색 결과 관심종목</Text>
            <Text style={styles.quickStatValue}>{filteredWatchlist.length}</Text>
          </View>
          <View style={styles.quickStatCard}>
            <Text style={styles.kpiLabel}>검색 결과 보유종목</Text>
            <Text style={styles.quickStatValue}>{filteredPortfolioPositions.length}</Text>
          </View>
        </View>
      </View>

      {/* ── 관심종목 요약 ── */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.cardTitleRow}>
            <Eye size={14} color="#0d9488" strokeWidth={2.5} />
            <Text style={styles.cardTitle}>관심종목 요약</Text>
          </View>
          <Text style={styles.metaText}>{filteredWatchlist.length}개 · 탭하면 상세</Text>
        </View>
        {topWatchlist.length ? (
          topWatchlist.map((item) => (
            <View key={`${item.market}-${item.ticker}-${item.id || item.name}`} style={styles.summaryRow}>
              <Pressable
                onPress={() => onOpenDetail(item.market, item.ticker, item.name)}
                style={({ pressed }) => [styles.metricLeft, pressed && { opacity: 0.6 }]}
              >
                <Text style={styles.metricName}>{item.name}</Text>
                <Text style={styles.metricState}>{item.market} · {item.ticker} · {item.sector}</Text>
              </Pressable>
              <Pressable
                onPress={() => onOpenDetail(item.market, item.ticker, item.name)}
                style={({ pressed }) => [styles.summaryValueBox, pressed && { opacity: 0.6 }]}
              >
                <Text style={styles.summaryMeta}>{item.stance}</Text>
                <Text style={styles.metricScore}>{formatCompactNumber(item.price)}</Text>
                <Text style={[styles.summaryDelta, { color: item.changeRate >= 0 ? '#dc2626' : '#2563eb' }]}>
                  {formatSignedRate(item.changeRate)}
                </Text>
              </Pressable>
              {item.id ? (
                <Pressable
                  onPress={() => onRemoveWatch(item.id)}
                  hitSlop={10}
                  style={({ pressed }) => [{
                    padding: 6, marginLeft: 4, borderRadius: 999,
                    backgroundColor: pressed ? '#fee2e2' : 'transparent',
                  }]}
                  accessibilityLabel="관심종목 해제"
                >
                  <X size={14} color="#94a3b8" strokeWidth={2.5} />
                </Pressable>
              ) : null}
            </View>
          ))
        ) : (
          <Text style={styles.metaText}>아직 관심종목이 없어. 종목 탭에서 + 버튼으로 담아봐.</Text>
        )}
      </View>

      {/* ── 포트폴리오 (실제 보유) 요약 ── */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.cardTitleRow}>
            <Briefcase size={14} color="#3b82f6" strokeWidth={2.5} />
            <Text style={styles.cardTitle}>실제 보유 종목 (포트폴리오)</Text>
          </View>
          <Text style={styles.metaText}>
            {portfolio ? `손익 ${formatSignedRate(portfolio.totalProfitRate)}` : '-'}
          </Text>
        </View>
        {portfolio ? (
          <View style={styles.portfolioSummaryRow}>
            <View style={styles.portfolioSummaryCard}>
              <Text style={styles.kpiLabel}>총 평가금액</Text>
              <Text style={styles.chartStatValue}>{formatCompactNumber(portfolio.totalValue)}</Text>
            </View>
            <View style={styles.portfolioSummaryCard}>
              <Text style={styles.kpiLabel}>총 손익</Text>
              <Text style={[styles.chartStatValue, { color: portfolio.totalProfit >= 0 ? '#dc2626' : '#2563eb' }]}>
                {formatCompactNumber(portfolio.totalProfit)}
              </Text>
            </View>
          </View>
        ) : null}
        {topPortfolioPositions.length ? (
          topPortfolioPositions.map((item) => (
            <Pressable
              key={`${item.market}-${item.ticker}-${item.id || item.name}`}
              onPress={() => onOpenDetail(item.market, item.ticker, item.name)}
              style={({ pressed }) => [styles.summaryRow, pressed && { opacity: 0.6 }]}
            >
              <View style={styles.metricLeft}>
                <Text style={styles.metricName}>{item.name}</Text>
                <Text style={styles.metricState}>{item.market} · {item.ticker} · {item.quantity}주</Text>
              </View>
              <View style={styles.summaryValueBox}>
                <Text style={styles.metricScore}>{formatCompactNumber(item.currentPrice)}</Text>
                <Text style={[styles.summaryDelta, { color: item.profitRate >= 0 ? '#dc2626' : '#2563eb' }]}>
                  {formatSignedRate(item.profitRate)}
                </Text>
              </View>
            </Pressable>
          ))
        ) : (
          <Text style={styles.metaText}>실제 보유 중인 종목이 없어.</Text>
        )}
      </View>
    </ScrollView>
  )
}
