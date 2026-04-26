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
import { TopMoversSection } from './market_parts/TopMoversSection'
import { AlternativeSignalsSection } from './market_parts/AlternativeSignalsSection'
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
  onOpenDetail,
  refreshing,
  onRefresh,
  onChartMarketChange,
  onChartPeriodChange,
  onSelectedIndexLabelChange,
}: Props) {
  const styles = useStyles()
  const isWeb = Platform.OS === 'web'
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

      <MarketSummaryMetrics metrics={summary?.marketSummary ?? []} />

      {topMovers ? (
        <TopMoversSection topMovers={topMovers} kind="gainers" onOpenDetail={onOpenDetail} />
      ) : null}
      {topMovers ? (
        <TopMoversSection topMovers={topMovers} kind="losers" onOpenDetail={onOpenDetail} />
      ) : null}

      <WatchAlertList alerts={summary?.watchAlerts ?? []} />

      <AlternativeSignalsSection signals={summary?.alternativeSignals ?? []} />
    </ScrollView>
  )
}
