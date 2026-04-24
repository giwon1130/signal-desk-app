import { useState } from 'react'
import { Linking, Modal, Platform, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import { BarChart2, Bell, Flame, Globe, Info, Snowflake, TrendingUp, X, Zap } from 'lucide-react-native'
import { CandleVolumeChart } from '../components/CandleVolumeChart'
import { CollapsibleCard } from '../components/CollapsibleCard'
import { useStyles } from '../styles'
import type {
  AlternativeSignal,
  ChartPeriodSnapshot,
  IndexMetric,
  MarketKey,
  MarketSection,
  MarketSummaryData,
  PeriodKey,
  TopMover,
  TopMoversResponse,
} from '../types'
import {
  formatCompactNumber,
  formatSignedRate,
  getAlertPalette,
  getAlternativeSignalPalette,
  getMetricAccent,
} from '../utils'

type Props = {
  summary: MarketSummaryData | null
  activeSection: MarketSection | null
  activeIndex: IndexMetric | null
  activePeriod: ChartPeriodSnapshot | null
  chartMarket: MarketKey
  chartPeriod: PeriodKey
  selectedIndexLabel: string
  chartWidth: number
  topMovers: TopMoversResponse | null
  onOpenDetail: (market: string, ticker: string, name?: string) => void
  refreshing: boolean
  onRefresh: () => Promise<void>
  onChartMarketChange: (market: MarketKey) => void
  onChartPeriodChange: (period: PeriodKey) => void
  onSelectedIndexLabelChange: (label: string) => void
}

function MoverRow({
  item,
  onOpenDetail,
}: {
  item: TopMover
  onOpenDetail: (market: string, ticker: string, name?: string) => void
}) {
  const styles = useStyles()
  const color = item.changeRate >= 0 ? '#dc2626' : '#2563eb'
  return (
    <Pressable
      onPress={() => onOpenDetail(item.market, item.ticker, item.name)}
      style={({ pressed }) => [styles.summaryRow, pressed && { opacity: 0.6 }]}
    >
      <View style={styles.metricLeft}>
        <Text style={styles.metricName}>{item.name}</Text>
        <Text style={styles.metricState}>{item.market} · {item.ticker}</Text>
      </View>
      <View style={styles.summaryValueBox}>
        <Text style={styles.metricScore}>{formatCompactNumber(item.price)}</Text>
        <Text style={[styles.summaryDelta, { color }]}>{formatSignedRate(item.changeRate)}</Text>
      </View>
    </Pressable>
  )
}

export function MarketTab({
  summary,
  activeSection,
  activeIndex,
  activePeriod,
  chartMarket,
  chartPeriod,
  selectedIndexLabel,
  chartWidth,
  topMovers,
  onOpenDetail,
  refreshing,
  onRefresh,
  onChartMarketChange,
  onChartPeriodChange,
  onSelectedIndexLabelChange,
}: Props) {
  const styles = useStyles()
  const [activeSignal, setActiveSignal] = useState<AlternativeSignal | null>(null)
  const isWeb = Platform.OS === 'web'
  return (
    <ScrollView
      style={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={[styles.content, isWeb && styles.contentWeb]}
    >
      {/* ── 지수 선택 ── */}
      <View style={[styles.card, isWeb && styles.cardFull]}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.cardTitleRow}>
            <Globe size={14} color="#3b82f6" strokeWidth={2.5} />
            <Text style={styles.cardTitle}>지수 차트</Text>
          </View>
          <Text style={styles.metaText}>{activeSection?.title ?? '-'}</Text>
        </View>
        <View style={styles.filterRow}>
          {(['KR', 'US'] as const).map((market) => (
            <Pressable
              key={market}
              onPress={() => onChartMarketChange(market)}
              style={[styles.filterChip, chartMarket === market && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, chartMarket === market && styles.filterTextActive]}>
                {market === 'KR' ? '🇰🇷 한국' : '🇺🇸 미국'}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.filterRow}>
          {(['D', 'W', 'M'] as const).map((period) => (
            <Pressable
              key={period}
              onPress={() => onChartPeriodChange(period)}
              style={[styles.filterChip, chartPeriod === period && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, chartPeriod === period && styles.filterTextActive]}>
                {period === 'D' ? '일봉' : period === 'W' ? '주봉' : '월봉'}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.indexChipRow}>
          {(activeSection?.indices ?? []).map((item) => (
            <Pressable
              key={item.label}
              onPress={() => onSelectedIndexLabelChange(item.label)}
              style={[styles.indexChip, selectedIndexLabel === item.label && styles.indexChipActive]}
            >
              <Text style={[styles.indexChipText, selectedIndexLabel === item.label && styles.indexChipTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* ── 차트 & 통계 ── */}
      <View style={[styles.card, isWeb && styles.cardFull]}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.cardTitleRow}>
            <BarChart2 size={14} color="#6366f1" strokeWidth={2.5} />
            <Text style={styles.cardTitle}>
              {activeIndex?.label ?? '-'} · {activePeriod?.label ?? '-'}
            </Text>
          </View>
          {activeIndex ? (
            <Text style={[styles.metaText, { color: activeIndex.changeRate >= 0 ? '#dc2626' : '#2563eb', fontWeight: '700' }]}>
              {formatSignedRate(activeIndex.changeRate)}
            </Text>
          ) : null}
        </View>
        <CandleVolumeChart points={activePeriod?.points ?? []} width={chartWidth} />
        <View style={styles.legendRow}>
          <Text style={[styles.legendText, { color: '#f59e0b' }]}>MA5</Text>
          <Text style={[styles.legendText, { color: '#6366f1' }]}>MA20</Text>
          <Text style={[styles.legendText, { color: '#10b981' }]}>MA60</Text>
        </View>
        {activePeriod ? (
          <View style={styles.chartStatsRow}>
            <View style={styles.chartStat}>
              <Text style={styles.kpiLabel}>현재</Text>
              <Text style={styles.chartStatValue}>{activePeriod.stats.latest.toFixed(2)}</Text>
            </View>
            <View style={styles.chartStat}>
              <Text style={styles.kpiLabel}>고가</Text>
              <Text style={[styles.chartStatValue, { color: '#dc2626' }]}>{activePeriod.stats.high.toFixed(2)}</Text>
            </View>
            <View style={styles.chartStat}>
              <Text style={styles.kpiLabel}>저가</Text>
              <Text style={[styles.chartStatValue, { color: '#2563eb' }]}>{activePeriod.stats.low.toFixed(2)}</Text>
            </View>
            <View style={styles.chartStat}>
              <Text style={styles.kpiLabel}>거래량 평균</Text>
              <Text style={styles.chartStatValue}>{formatCompactNumber(activePeriod.stats.averageVolume)}</Text>
            </View>
            <View style={styles.chartStat}>
              <Text style={styles.kpiLabel}>등락률</Text>
              <Text
                style={[
                  styles.chartStatValue,
                  { color: activePeriod.stats.changeRate >= 0 ? '#dc2626' : '#2563eb' },
                ]}
              >
                {formatSignedRate(activePeriod.stats.changeRate)}
              </Text>
            </View>
            <View style={styles.chartStat}>
              <Text style={styles.kpiLabel}>진폭</Text>
              <Text style={styles.chartStatValue}>{activePeriod.stats.range.toFixed(2)}</Text>
            </View>
          </View>
        ) : null}
      </View>

      {/* ── 시장 요약 지표 (정량 체온 — 차트 바로 아래) ── */}
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

      {/* ── 급등 / 급락 상위 종목 ── */}
      {topMovers ? (
        <CollapsibleCard
          title={
            <View style={styles.cardTitleRow}>
              <Flame size={14} color="#dc2626" strokeWidth={2.5} />
              <Text style={styles.cardTitle}>급등 종목 (KOSPI · KOSDAQ)</Text>
            </View>
          }
          preview={
            <Text style={[styles.metaText, { color: '#dc2626', fontWeight: '700' }]}>
              {topMovers.kospi.gainers[0] ? `${topMovers.kospi.gainers[0].name} ${formatSignedRate(topMovers.kospi.gainers[0].changeRate)}` : '-'}
            </Text>
          }
        >
          <Text style={styles.metaText}>KOSPI · {topMovers.kospi.gainers.length}종목</Text>
          {topMovers.kospi.gainers.map((m) => (
            <MoverRow key={`kospi-up-${m.ticker}`} item={m} onOpenDetail={onOpenDetail} />
          ))}
          <Text style={[styles.metaText, { marginTop: 6 }]}>KOSDAQ · {topMovers.kosdaq.gainers.length}종목</Text>
          {topMovers.kosdaq.gainers.map((m) => (
            <MoverRow key={`kosdaq-up-${m.ticker}`} item={m} onOpenDetail={onOpenDetail} />
          ))}
        </CollapsibleCard>
      ) : null}

      {topMovers ? (
        <CollapsibleCard
          title={
            <View style={styles.cardTitleRow}>
              <Snowflake size={14} color="#2563eb" strokeWidth={2.5} />
              <Text style={styles.cardTitle}>급락 종목 (KOSPI · KOSDAQ)</Text>
            </View>
          }
          preview={
            <Text style={[styles.metaText, { color: '#2563eb', fontWeight: '700' }]}>
              {topMovers.kospi.losers[0] ? `${topMovers.kospi.losers[0].name} ${formatSignedRate(topMovers.kospi.losers[0].changeRate)}` : '-'}
            </Text>
          }
        >
          <Text style={styles.metaText}>KOSPI · {topMovers.kospi.losers.length}종목</Text>
          {topMovers.kospi.losers.map((m) => (
            <MoverRow key={`kospi-dn-${m.ticker}`} item={m} onOpenDetail={onOpenDetail} />
          ))}
          <Text style={[styles.metaText, { marginTop: 6 }]}>KOSDAQ · {topMovers.kosdaq.losers.length}종목</Text>
          {topMovers.kosdaq.losers.map((m) => (
            <MoverRow key={`kosdaq-dn-${m.ticker}`} item={m} onOpenDetail={onOpenDetail} />
          ))}
        </CollapsibleCard>
      ) : null}

      {/* ── 관심종목 시그널 (내 종목 관련 — 실험 지표 위) ── */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.cardTitleRow}>
            <Bell size={14} color="#dc2626" strokeWidth={2.5} />
            <Text style={styles.cardTitle}>관심종목 시그널</Text>
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
            <Bell size={14} color="#94a3b8" strokeWidth={2} />
            <Text style={styles.metaText}>지금 주목할 시그널은 없어. 안정 구간이야.</Text>
          </View>
        )}
      </View>

      {/* ── 실험 지표 (보조 — 하단 참고용) ── */}
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.cardTitleRow}>
            <Zap size={14} color="#f59e0b" strokeWidth={2.5} />
            <Text style={styles.cardTitle}>실험 지표</Text>
          </View>
          <Text style={styles.metaText}>탭하면 설명 ·  {summary?.alternativeSignals.length ?? 0}개</Text>
        </View>
        {(summary?.alternativeSignals ?? []).map((item) => {
          const palette = getAlternativeSignalPalette(item.score)
          return (
            <Pressable
              key={item.label}
              onPress={() => setActiveSignal(item)}
              style={({ pressed }) => [
                styles.metricRow,
                styles.alternativeMetricRow,
                {
                  backgroundColor: palette.backgroundColor,
                  borderColor: palette.borderColor,
                },
                pressed && { opacity: 0.7 },
              ]}
            >
              <View style={styles.metricLeft}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.metricName}>{item.label}</Text>
                  <Info size={12} color="#94a3b8" strokeWidth={2} />
                </View>
                <Text style={styles.metricState}>{item.state}</Text>
              </View>
              <View style={styles.alternativeMetricTopRow}>
                <Text style={[styles.metricScore, { color: getMetricAccent(item.score) }]}>{item.score}</Text>
                <Text
                  style={[
                    styles.alternativeScoreBadge,
                    {
                      backgroundColor: palette.badgeBackgroundColor,
                      color: palette.badgeTextColor,
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
              {item.personalImpact ? (
                <Text style={styles.alternativePersonalImpact}>{item.personalImpact}</Text>
              ) : null}
              <Text style={styles.metricSource}>{item.source} · Experimental</Text>
            </Pressable>
          )
        })}
      </View>

      {/* ── 실험 지표 상세 모달 ── */}
      <Modal
        visible={activeSignal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveSignal(null)}
      >
        <Pressable style={styles.signalModalBackdrop} onPress={() => setActiveSignal(null)}>
          <Pressable style={styles.signalModalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.signalModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.signalModalTitle}>{activeSignal?.label}</Text>
                <Text style={styles.signalModalSubtitle}>{activeSignal?.state} · 점수 {activeSignal?.score}</Text>
              </View>
              <Pressable onPress={() => setActiveSignal(null)} hitSlop={12}>
                <X size={18} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              {activeSignal?.description ? (
                <View style={styles.signalModalSection}>
                  <Text style={styles.signalModalSectionTitle}>이게 뭐야?</Text>
                  <Text style={styles.signalModalBody}>{activeSignal.description}</Text>
                </View>
              ) : null}

              {activeSignal?.methodology ? (
                <View style={styles.signalModalSection}>
                  <Text style={styles.signalModalSectionTitle}>점수 계산 방식</Text>
                  <Text style={styles.signalModalBody}>{activeSignal.methodology}</Text>
                </View>
              ) : null}

              <View style={styles.signalModalSection}>
                <Text style={styles.signalModalSectionTitle}>지금 관측치</Text>
                <Text style={styles.signalModalBody}>{activeSignal?.note}</Text>
                <View style={[styles.alternativeHighlightsRow, { marginTop: 8 }]}>
                  {(activeSignal?.highlights ?? []).map((h) => (
                    <Text key={h} style={styles.alternativeHighlightChip}>{h}</Text>
                  ))}
                </View>
              </View>

              <View style={styles.signalModalSection}>
                <Text style={styles.signalModalSectionTitle}>데이터 출처</Text>
                <Text style={styles.signalModalBody}>{activeSignal?.source}</Text>
                {activeSignal?.url ? (
                  <Pressable onPress={() => activeSignal.url && void Linking.openURL(activeSignal.url)}>
                    <Text style={styles.signalModalLink}>{activeSignal.url}</Text>
                  </Pressable>
                ) : null}
              </View>

              <Text style={styles.signalModalDisclaimer}>
                실험 지표는 보조 신호일 뿐이야. 단독으로 매매 근거로 쓰지 말고 다른 시그널이랑 같이 봐.
              </Text>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  )
}
