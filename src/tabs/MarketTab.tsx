import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import { CandleVolumeChart } from '../components/CandleVolumeChart'
import { styles } from '../styles'
import type { ChartPeriodSnapshot, IndexMetric, MarketKey, MarketSection, PeriodKey } from '../types'
import { formatCompactNumber, formatSignedRate } from '../utils'

type Props = {
  activeSection: MarketSection | null
  activeIndex: IndexMetric | null
  activePeriod: ChartPeriodSnapshot | null
  chartMarket: MarketKey
  chartPeriod: PeriodKey
  selectedIndexLabel: string
  chartWidth: number
  refreshing: boolean
  onRefresh: () => Promise<void>
  onChartMarketChange: (market: MarketKey) => void
  onChartPeriodChange: (period: PeriodKey) => void
  onSelectedIndexLabelChange: (label: string) => void
}

export function MarketTab({
  activeSection,
  activeIndex,
  activePeriod,
  chartMarket,
  chartPeriod,
  selectedIndexLabel,
  chartWidth,
  refreshing,
  onRefresh,
  onChartMarketChange,
  onChartPeriodChange,
  onSelectedIndexLabelChange,
}: Props) {
  return (
    <ScrollView
      style={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.content}
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>지수 차트</Text>
        <View style={styles.filterRow}>
          {(['KR', 'US'] as const).map((market) => (
            <Pressable
              key={market}
              onPress={() => onChartMarketChange(market)}
              style={[styles.filterChip, chartMarket === market && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, chartMarket === market && styles.filterTextActive]}>
                {market === 'KR' ? '한국' : '미국'}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.filterRow}>
          {(['1D', '1M', '1Y'] as const).map((period) => (
            <Pressable
              key={period}
              onPress={() => onChartPeriodChange(period)}
              style={[styles.filterChip, chartPeriod === period && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, chartPeriod === period && styles.filterTextActive]}>
                {period}
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

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {activeIndex?.label ?? '-'} · {activePeriod?.label ?? '-'}
        </Text>
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
              <Text style={styles.chartStatValue}>{activePeriod.stats.high.toFixed(2)}</Text>
            </View>
            <View style={styles.chartStat}>
              <Text style={styles.kpiLabel}>저가</Text>
              <Text style={styles.chartStatValue}>{activePeriod.stats.low.toFixed(2)}</Text>
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
    </ScrollView>
  )
}
