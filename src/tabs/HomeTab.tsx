import { RefreshControl, ScrollView, Text, TextInput, View } from 'react-native'
import {
  Activity,
  AlertTriangle,
  Bell,
  Briefcase,
  CheckCircle,
  Clock,
  Eye,
  Newspaper,
  Search,
  TrendingUp,
  Zap,
} from 'lucide-react-native'
import { styles } from '../styles'
import type { HoldingPosition, MarketSummaryData, PortfolioSummary, WatchItem } from '../types'
import {
  formatCompactNumber,
  formatSignedRate,
  getAlertPalette,
  getAlternativeSignalPalette,
  getMetricAccent,
  getMarketStatusTone,
  getSessionPalette,
} from '../utils'

type Props = {
  summary: MarketSummaryData | null
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
  summary,
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
  return (
    <ScrollView
      style={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.content}
    >
      {/* ── 마켓 상태 ── */}
      <View style={styles.primaryCard}>
        <View style={styles.cardTitleRow}>
          <Activity size={13} color="#3b82f6" strokeWidth={2.5} />
          <Text style={styles.cardEyebrow}>MARKET STATUS</Text>
        </View>
        <Text style={[styles.primaryValue, { color: getMarketStatusTone(summary?.marketStatus) }]}>
          {summary?.marketStatus ?? '-'}
        </Text>
        <Text style={styles.cardNote}>{summary?.summary ?? '-'}</Text>
        <Text style={styles.metaText}>업데이트: {summary?.generatedAt ?? '-'}</Text>
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

      {/* ── 장전 브리핑 ── */}
      {summary?.briefing ? (
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.cardTitleRow}>
              <Newspaper size={14} color="#0d9488" strokeWidth={2.5} />
              <Text style={styles.cardTitle}>장전 브리핑</Text>
            </View>
            <Text style={styles.metaText}>{summary.briefing.preMarket.length}개 포인트</Text>
          </View>
          <Text style={styles.cardNote}>{summary.briefing.headline}</Text>
          <View style={styles.briefingList}>
            {summary.briefing.preMarket.slice(0, 3).map((item) => (
              <View key={item} style={styles.briefingBulletRow}>
                <CheckCircle size={13} color="#0d9488" strokeWidth={2.5} style={{ marginTop: 3 }} />
                <Text style={styles.briefingItem}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

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

      {/* ── 장 세션 ── */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.cardTitleRow}>
            <Clock size={14} color="#7c3aed" strokeWidth={2.5} />
            <Text style={styles.cardTitle}>장 세션</Text>
          </View>
          <Text style={styles.metaText}>{summary?.marketSessions.length ?? 0}개 시장</Text>
        </View>
        {(summary?.marketSessions ?? []).map((session) => (
          <View key={session.market} style={styles.sessionCard}>
            <View style={styles.sessionTop}>
              <Text style={styles.sessionName}>{session.label}</Text>
              <Text
                style={[
                  styles.sessionBadge,
                  {
                    backgroundColor: getSessionPalette(session.isOpen).backgroundColor,
                    color: getSessionPalette(session.isOpen).textColor,
                  },
                ]}
              >
                {session.status}
              </Text>
            </View>
            <Text style={styles.sessionMeta}>{session.localTime} · {session.phase}</Text>
            <Text style={styles.sessionNote}>{session.note}</Text>
          </View>
        ))}
      </View>

      {/* ── 시장 요약 지표 ── */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.cardTitleRow}>
            <TrendingUp size={14} color="#3b82f6" strokeWidth={2.5} />
            <Text style={styles.cardTitle}>시장 요약 지표</Text>
          </View>
          <Text style={styles.metaText}>{summary?.marketSummary.length ?? 0}개</Text>
        </View>
        {(summary?.marketSummary ?? []).map((item) => (
          <View key={item.label} style={styles.metricRow}>
            <View style={styles.metricLeft}>
              <Text style={styles.metricName}>{item.label}</Text>
              <Text style={styles.metricState}>{item.state}</Text>
            </View>
            <Text style={[styles.metricScore, { color: getMetricAccent(item.score) }]}>{item.score.toFixed(1)}</Text>
            <Text style={styles.metricNote}>{item.note}</Text>
          </View>
        ))}
      </View>

      {/* ── 실험 지표 ── */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.cardTitleRow}>
            <Zap size={14} color="#f59e0b" strokeWidth={2.5} />
            <Text style={styles.cardTitle}>실험 지표</Text>
          </View>
          <Text style={styles.metaText}>{summary?.alternativeSignals.length ?? 0}개</Text>
        </View>
        {(summary?.alternativeSignals ?? []).map((item) => (
          <View
            key={item.label}
            style={[
              styles.metricRow,
              styles.alternativeMetricRow,
              {
                backgroundColor: getAlternativeSignalPalette(item.score).backgroundColor,
                borderColor: getAlternativeSignalPalette(item.score).borderColor,
              },
            ]}
          >
            <View style={styles.metricLeft}>
              <Text style={styles.metricName}>{item.label}</Text>
              <Text style={styles.metricState}>{item.state}</Text>
            </View>
            <View style={styles.alternativeMetricTopRow}>
              <Text style={[styles.metricScore, { color: getMetricAccent(item.score) }]}>{item.score}</Text>
              <Text
                style={[
                  styles.alternativeScoreBadge,
                  {
                    backgroundColor: getAlternativeSignalPalette(item.score).badgeBackgroundColor,
                    color: getAlternativeSignalPalette(item.score).badgeTextColor,
                  },
                ]}
              >
                {item.state}
              </Text>
            </View>
            <View style={styles.alternativeHighlightsRow}>
              {item.highlights.map((highlight) => (
                <Text key={`${item.label}-${highlight}`} style={styles.alternativeHighlightChip}>
                  {highlight}
                </Text>
              ))}
            </View>
            <Text style={styles.metricNote}>{item.note}</Text>
            <Text style={styles.metricSource}>{item.source} · Experimental</Text>
          </View>
        ))}
      </View>

      {/* ── 이상징후 ── */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.cardTitleRow}>
            <Bell size={14} color="#dc2626" strokeWidth={2.5} />
            <Text style={styles.cardTitle}>관심종목 이상징후</Text>
          </View>
          <Text style={styles.metaText}>{summary?.watchAlerts.length ?? 0}건</Text>
        </View>
        {(summary?.watchAlerts ?? []).length ? (
          (summary?.watchAlerts ?? []).map((item) => (
            <View
              key={`${item.category}-${item.market}-${item.ticker}`}
              style={[
                styles.metricRow,
                styles.alertMetricRow,
                {
                  backgroundColor: getAlertPalette(item.severity).backgroundColor,
                  borderColor: getAlertPalette(item.severity).borderColor,
                },
              ]}
            >
              <View style={styles.metricLeft}>
                <Text style={styles.metricName}>{item.name}</Text>
                <Text style={styles.metricState}>{item.market} · {item.ticker} · {item.title}</Text>
              </View>
              <View style={styles.alternativeMetricTopRow}>
                <Text style={[styles.metricScore, { color: getMetricAccent(item.score) }]}>{item.score}</Text>
                <Text
                  style={[
                    styles.alternativeScoreBadge,
                    {
                      backgroundColor: getAlertPalette(item.severity).badgeBackgroundColor,
                      color: getAlertPalette(item.severity).badgeColor,
                    },
                  ]}
                >
                  {item.severity.toUpperCase()}
                </Text>
              </View>
              <View style={styles.alternativeHighlightsRow}>
                {item.tags.map((tag) => (
                  <Text key={`${item.market}-${item.ticker}-${tag}`} style={styles.alternativeHighlightChip}>
                    {tag}
                  </Text>
                ))}
              </View>
              <Text style={styles.metricNote}>{item.note}</Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyStateRow}>
            <AlertTriangle size={14} color="#94a3b8" strokeWidth={2} />
            <Text style={styles.metaText}>지금 바로 볼 이상징후는 없어.</Text>
          </View>
        )}
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
