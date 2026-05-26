import { Platform, RefreshControl, ScrollView } from 'react-native'
import { useStyles } from '../styles'
import type {
  ChartPeriodSnapshot,
  IndexMetric,
  MarketKey,
  MarketSection,
  MarketSummaryData,
  PeriodKey,
  TopMoversResponse,
} from '../types'
import type { MarketPreference } from '../api/alertPreferences'
import { TopMoversSection } from './market_parts/TopMoversSection'
import { CompositeRiskCard } from './market_parts/CompositeRiskCard'
import { ChartSection } from './market_parts/ChartSection'
import { MarketSummaryMetrics } from './market_parts/MarketSummaryMetrics'
import { WatchAlertList } from './market_parts/WatchAlertList'

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
  marketPreference?: MarketPreference   // 'KR' | 'US' | 'BOTH' — UI 노출 범위 필터
  onOpenDetail: (market: string, ticker: string, name?: string) => void
  refreshing: boolean
  onRefresh: () => Promise<void>
  onChartMarketChange: (market: MarketKey) => void
  onChartPeriodChange: (period: PeriodKey) => void
  onSelectedIndexLabelChange: (label: string) => void
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
  marketPreference = 'BOTH',
  onOpenDetail,
  refreshing,
  onRefresh,
  onChartMarketChange,
  onChartPeriodChange,
  onSelectedIndexLabelChange,
}: Props) {
  const styles = useStyles()
  const isWeb = Platform.OS === 'web'
  const showKr = marketPreference === 'KR' || marketPreference === 'BOTH'
  const showUs = marketPreference === 'US' || marketPreference === 'BOTH'

  // 요약 지표(Fear Meter / KR Heat / US Heat / Flow Bias) 필터.
  // Fear Meter 는 VIX 기반 글로벌 거시 신호 → 항상 노출.
  // KR Heat / Flow Bias 는 KR 시장 무드, US Heat 는 US 시장 무드 → 선호 시장만.
  const filteredMetrics = (summary?.marketSummary ?? []).filter((m) => {
    const label = m.label
    if (label === 'Fear Meter') return true               // 글로벌 거시
    if (label === 'KR Heat' || label === 'Flow Bias') return showKr
    if (label === 'US Heat') return showUs
    return true                                            // 알 수 없는 라벨은 안전하게 노출
  })

  return (
    <ScrollView
      style={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={[styles.content, isWeb && styles.contentWeb]}
    >
      <ChartSection
        activeSection={activeSection}
        activeIndex={activeIndex}
        activePeriod={activePeriod}
        chartMarket={chartMarket}
        chartPeriod={chartPeriod}
        selectedIndexLabel={selectedIndexLabel}
        chartWidth={chartWidth}
        onChartMarketChange={onChartMarketChange}
        onChartPeriodChange={onChartPeriodChange}
        onSelectedIndexLabelChange={onSelectedIndexLabelChange}
      />

      <MarketSummaryMetrics metrics={filteredMetrics} />

      {/* 합성 위험도 — 요약 지표와 함께 '시장 무드' 블록으로 묶음 */}
      <CompositeRiskCard risk={summary?.compositeRisk ?? null} />

      {showKr && topMovers ? (
        <TopMoversSection topMovers={topMovers} kind="gainers" market="KR" onOpenDetail={onOpenDetail} />
      ) : null}
      {showKr && topMovers ? (
        <TopMoversSection topMovers={topMovers} kind="losers" market="KR" onOpenDetail={onOpenDetail} />
      ) : null}
      {showUs && topMovers?.us ? (
        <TopMoversSection topMovers={topMovers} kind="gainers" market="US" onOpenDetail={onOpenDetail} />
      ) : null}
      {showUs && topMovers?.us ? (
        <TopMoversSection topMovers={topMovers} kind="losers" market="US" onOpenDetail={onOpenDetail} />
      ) : null}

      {/* 관심종목 알림 — 개인 정보라 시장 지표 다음, 맨 아래 */}
      <WatchAlertList alerts={summary?.watchAlerts ?? []} />
    </ScrollView>
  )
}
