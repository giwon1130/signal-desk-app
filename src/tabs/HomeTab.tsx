import { useMemo } from 'react'
import { Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native'
import { Briefcase, Eye, Search, X } from 'lucide-react-native'
import { useLivePrices } from '../hooks/useLivePrices'
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

  // 화면에 보이는(top-N) 관심·보유 종목 티커만 구독. 전체를 구독하면 서버 부하↑.
  const liveTickers = useMemo(() => {
    const fromWatch = topWatchlist.map((w) => w.ticker)
    const fromPort = topPortfolioPositions.map((p) => p.ticker)
    return Array.from(new Set([...fromWatch, ...fromPort])).filter(Boolean)
  }, [topWatchlist, topPortfolioPositions])
  const livePrices = useLivePrices(liveTickers)

  // 포트폴리오 총 평가/손익도 라이브 가격으로 재계산해서 표기.
  const livePortfolio = useMemo(() => {
    if (!portfolio) return null
    let totalCost = 0
    let totalValue = 0
    for (const p of portfolio.positions) {
      const livePrice = livePrices[p.ticker]?.price ?? p.currentPrice
      totalCost += p.buyPrice * p.quantity
      totalValue += livePrice * p.quantity
    }
    const totalProfit = totalValue - totalCost
    const totalProfitRate = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0
    return { totalCost, totalValue, totalProfit, totalProfitRate }
  }, [portfolio, livePrices])

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
          <Text style={[styles.heroMetricValue, { color: (livePortfolio?.totalProfitRate ?? 0) >= 0 ? '#dc2626' : '#2563eb' }]}>
            {livePortfolio ? formatSignedRate(livePortfolio.totalProfitRate) : '-'}
          </Text>
          <Text style={styles.heroMetricFootnote}>{portfolio?.positions.length ?? 0}개 보유 · 누적 손익</Text>
        </View>
      </View>

      {/* ── 포트폴리오 (실제 보유) 요약 — 실제 돈이 걸려있어서 최우선 ── */}
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
        {livePortfolio ? (
          <View style={styles.portfolioSummaryRow}>
            <View style={styles.portfolioSummaryCard}>
              <Text style={styles.kpiLabel}>총 평가금액</Text>
              <Text style={styles.chartStatValue}>{formatCompactNumber(livePortfolio.totalValue)}</Text>
            </View>
            <View style={styles.portfolioSummaryCard}>
              <Text style={styles.kpiLabel}>총 손익</Text>
              <Text style={[styles.chartStatValue, { color: livePortfolio.totalProfit >= 0 ? '#dc2626' : '#2563eb' }]}>
                {formatCompactNumber(livePortfolio.totalProfit)}
              </Text>
            </View>
          </View>
        ) : null}
        {topPortfolioPositions.length ? (
          topPortfolioPositions.map((item) => {
            const live = livePrices[item.ticker]
            const currentPrice = live?.price ?? item.currentPrice
            const profitRate = item.buyPrice > 0 ? ((currentPrice - item.buyPrice) / item.buyPrice) * 100 : item.profitRate
            return (
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
                <Text style={styles.metricScore}>{formatCompactNumber(currentPrice)}</Text>
                <Text style={[styles.summaryDelta, { color: profitRate >= 0 ? '#dc2626' : '#2563eb' }]}>
                  {formatSignedRate(profitRate)}
                </Text>
              </View>
            </Pressable>
            )
          })
        ) : (
          <Text style={styles.metaText}>실제 보유 중인 종목이 없어.</Text>
        )}
      </View>

      {/* ── 관심종목 요약 (추적만 함) ── */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.cardTitleRow}>
            <Eye size={14} color="#0d9488" strokeWidth={2.5} />
            <Text style={styles.cardTitle}>관심종목 요약</Text>
          </View>
          <Text style={styles.metaText}>{filteredWatchlist.length}개 · 탭하면 상세</Text>
        </View>
        {topWatchlist.length ? (
          topWatchlist.map((item) => {
            const live = livePrices[item.ticker]
            const displayPrice = live?.price ?? item.price
            const displayRate = live?.changeRate ?? item.changeRate
            return (
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
                <Text style={styles.metricScore}>{formatCompactNumber(displayPrice)}</Text>
                <Text style={[styles.summaryDelta, { color: displayRate >= 0 ? '#dc2626' : '#2563eb' }]}>
                  {formatSignedRate(displayRate)}
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
            )
          })
        ) : (
          <Text style={styles.metaText}>아직 관심종목이 없어. 종목 탭에서 + 버튼으로 담아봐.</Text>
        )}
      </View>

      {/* ── 빠른 검색 (도구 — 가장 아래) ── */}
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
    </ScrollView>
  )
}
