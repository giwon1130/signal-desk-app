import { Text, View } from 'react-native'
import { TrendingUp } from 'lucide-react-native'
import { useStyles } from '../../styles'
import type { MarketSummaryData } from '../../types'
import { getMetricAccent } from '../../utils'

type Props = {
  metrics: MarketSummaryData['marketSummary']
}

export function MarketSummaryMetrics({ metrics }: Props) {
  const styles = useStyles()
  return (
    <View style={styles.card}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.cardTitleRow}>
          <TrendingUp size={14} color="#3b82f6" strokeWidth={2.5} />
          <Text style={styles.cardTitle}>시장 요약 지표</Text>
        </View>
        <Text style={styles.metaText}>{metrics.length}개</Text>
      </View>
      {metrics.map((item) => (
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
  )
}
