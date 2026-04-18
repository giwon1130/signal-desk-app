import { RefreshControl, ScrollView, Text, TextInput, View } from 'react-native'
import { Briefcase, Eye, Search } from 'lucide-react-native'
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
}: Props) {
  const styles = useStyles()
  return (
    <ScrollView
      style={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.content}
    >
      {/* ── 히어로 KPI ── */}
      <View style={styles.heroMetricsRow}>
        <View style={[styles.heroMetricCard, styles.heroMetricCardDark]}>
          <Text style={[styles.heroMetricLabel, styles.heroMetricLabelOnDark]}>AI 성공률</Text>
          <Text style={[styles.heroMetricValue, styles.heroMetricValueOnDark]}>{successRate}</Text>
          <Text style={[styles.heroMetricFootnote, styles.heroMetricFootnoteOnDark]}>실현 수익률 기준</Text>
        </View>
        <View style={styles.heroMetricCard}>
          <Text style={styles.heroMetricLabel}>관심종목</Text>
          <Text style={styles.heroMetricValue}>{watchlist.length}</Text>
          <Text style={styles.heroMetricFootnote}>포착 중인 시그널</Text>
        </View>
        <View style={styles.heroMetricCard}>
          <Text style={styles.heroMetricLabel}>포트폴리오</Text>
          <Text style={[styles.heroMetricValue, { color: (portfolio?.totalProfitRate ?? 0) >= 0 ? '#dc2626' : '#2563eb' }]}>
            {portfolio ? formatSignedRate(portfolio.totalProfitRate) : '-'}
          </Text>
          <Text style={styles.heroMetricFootnote}>{portfolio?.positions.length ?? 0}개 종목 보유</Text>
        </View>
      </View>

      {/* ── 빠른 검색 ── */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.cardTitleRow}>
            <Search size={14} color="#3b82f6" strokeWidth={2.5} />
            <Text style={styles.cardTitle}>빠른 검색</Text>
          </View>
          <Text style={styles.metaText}>관심종목/포트폴리오</Text>
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
          <Text style={styles.metaText}>{filteredWatchlist.length}개</Text>
        </View>
        {topWatchlist.length ? (
          topWatchlist.map((item) => (
            <View key={`${item.market}-${item.ticker}-${item.id || item.name}`} style={styles.summaryRow}>
              <View style={styles.metricLeft}>
                <Text style={styles.metricName}>{item.name}</Text>
                <Text style={styles.metricState}>{item.market} · {item.ticker} · {item.sector}</Text>
              </View>
              <View style={styles.summaryValueBox}>
                <Text style={styles.summaryMeta}>{item.stance}</Text>
                <Text style={styles.metricScore}>{formatCompactNumber(item.price)}</Text>
                <Text style={[styles.summaryDelta, { color: item.changeRate >= 0 ? '#dc2626' : '#2563eb' }]}>
                  {formatSignedRate(item.changeRate)}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.metaText}>아직 관심종목이 없어.</Text>
        )}
      </View>

      {/* ── 포트폴리오 요약 ── */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.cardTitleRow}>
            <Briefcase size={14} color="#3b82f6" strokeWidth={2.5} />
            <Text style={styles.cardTitle}>포트폴리오 요약</Text>
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
            <View key={`${item.market}-${item.ticker}-${item.id || item.name}`} style={styles.summaryRow}>
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
            </View>
          ))
        ) : (
          <Text style={styles.metaText}>아직 보유 종목이 없어.</Text>
        )}
      </View>
    </ScrollView>
  )
}
