import { Platform, Pressable, Text, View } from 'react-native'
import { BarChart2, Globe } from 'lucide-react-native'
import { CandleVolumeChart } from '../../components/CandleVolumeChart'
import { useStyles } from '../../styles'
import type {
  ChartPeriodSnapshot,
  IndexMetric,
  MarketKey,
  MarketSection,
  PeriodKey,
} from '../../types'
import { formatCompactNumber, formatSignedRate } from '../../utils'

type Props = {
  activeSection: MarketSection | null
  activeIndex: IndexMetric | null
  activePeriod: ChartPeriodSnapshot | null
  chartMarket: MarketKey
  chartPeriod: PeriodKey
  selectedIndexLabel: string
  chartWidth: number
  onChartMarketChange: (market: MarketKey) => void
  onChartPeriodChange: (period: PeriodKey) => void
  onSelectedIndexLabelChange: (label: string) => void
}

export function ChartSection({
  activeSection,
  activeIndex,
  activePeriod,
  chartMarket,
  chartPeriod,
  selectedIndexLabel,
  chartWidth,
  onChartMarketChange,
  onChartPeriodChange,
  onSelectedIndexLabelChange,
}: Props) {
  const styles = useStyles()
  const isWeb = Platform.OS === 'web'
  return (
    <>
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
    </>
  )
}
