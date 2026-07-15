import { Text, View } from 'react-native'
import { Bell } from 'lucide-react-native'
import { useStyles } from '../../styles'
import { useTheme } from '../../theme'
import type { MarketSummaryData } from '../../types'

type Props = {
  alerts: MarketSummaryData['watchAlerts']
}

export function WatchAlertList({ alerts }: Props) {
  const styles = useStyles()
  const { palette } = useTheme()
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
        alerts.map((item) => {
          const tone = alertTone(item.severity, palette.scheme === 'dark')
          return (
            <View
            key={`${item.category}-${item.market}-${item.ticker}`}
            style={[
              styles.metricRow,
              styles.alertMetricRow,
              {
                backgroundColor: tone.backgroundColor,
                borderColor: tone.borderColor,
              },
            ]}
          >
            <View style={styles.metricLeft}>
              <Text style={styles.metricName} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
              <Text style={styles.metricState} numberOfLines={2} ellipsizeMode="tail">
                {item.market} · {item.ticker} · {item.title}
              </Text>
            </View>
            <View style={styles.alternativeMetricTopRow}>
              <Text style={[styles.metricScore, { color: tone.scoreColor }]}>{item.score}</Text>
              <Text
                style={[
                  styles.alternativeScoreBadge,
                  {
                    backgroundColor: tone.badgeBackgroundColor,
                    color: tone.badgeColor,
                  },
                ]}
              >
                {item.severity.toUpperCase()}
              </Text>
            </View>
            <View style={styles.alternativeHighlightsRow}>
              {item.tags.map((tag) => (
                <Text key={`${item.market}-${item.ticker}-${tag}`} style={[styles.alternativeHighlightChip, { backgroundColor: tone.chipBackgroundColor, color: palette.inkSub }]}>
                  {tag}
                </Text>
              ))}
            </View>
            <Text style={styles.metricNote} numberOfLines={3} ellipsizeMode="tail">{item.note}</Text>
          </View>
          )
        })
      ) : (
        <View style={styles.emptyStateRow}>
          <Bell size={14} color="#94a3b8" strokeWidth={2} />
          <Text style={styles.metaText}>지금 주목할 시그널은 없습니다. 안정 구간입니다.</Text>
        </View>
      )}
    </View>
  )
}

function alertTone(severity: 'low' | 'medium' | 'high', dark: boolean) {
  if (dark) {
    if (severity === 'high') return { backgroundColor: '#3a0e0e', borderColor: '#7f1d1d', badgeColor: '#fecdd3', badgeBackgroundColor: '#7f1d1d', chipBackgroundColor: '#541313', scoreColor: '#fca5a5' }
    if (severity === 'medium') return { backgroundColor: '#3a2a0e', borderColor: '#854d0e', badgeColor: '#fde68a', badgeBackgroundColor: '#713f12', chipBackgroundColor: '#523b15', scoreColor: '#fcd34d' }
    return { backgroundColor: '#083344', borderColor: '#155e75', badgeColor: '#a5f3fc', badgeBackgroundColor: '#155e75', chipBackgroundColor: '#164e63', scoreColor: '#67e8f9' }
  }
  if (severity === 'high') return { backgroundColor: '#fff1f2', borderColor: '#fecdd3', badgeColor: '#be123c', badgeBackgroundColor: '#ffe4e6', chipBackgroundColor: 'rgba(15,23,42,0.06)', scoreColor: '#b91c1c' }
  if (severity === 'medium') return { backgroundColor: '#fff7ed', borderColor: '#fed7aa', badgeColor: '#c2410c', badgeBackgroundColor: '#ffedd5', chipBackgroundColor: 'rgba(15,23,42,0.06)', scoreColor: '#a16207' }
  return { backgroundColor: '#ecfeff', borderColor: '#bae6fd', badgeColor: '#0f766e', badgeBackgroundColor: '#cffafe', chipBackgroundColor: 'rgba(15,23,42,0.06)', scoreColor: '#0f766e' }
}
