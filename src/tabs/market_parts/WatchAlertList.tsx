import { Text, View } from 'react-native'
import { Bell } from 'lucide-react-native'
import { useStyles } from '../../styles'
import type { MarketSummaryData } from '../../types'
import { getAlertPalette, getMetricAccent } from '../../utils'

type Props = {
  alerts: MarketSummaryData['watchAlerts']
}

export function WatchAlertList({ alerts }: Props) {
  const styles = useStyles()
  return (
    <View style={styles.card}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.cardTitleRow}>
          <Bell size={14} color="#dc2626" strokeWidth={2.5} />
          <Text style={styles.cardTitle}>관심종목 시그널</Text>
        </View>
        <Text style={styles.metaText}>{alerts.length}건</Text>
      </View>
      {alerts.length ? (
        alerts.map((item) => (
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
  )
}
