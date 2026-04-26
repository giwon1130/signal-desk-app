import { Linking, Platform, Pressable, Text, View } from 'react-native'
import { useStyles } from '../../styles'
import { useTheme } from '../../theme'
import type { NewsSentiment } from '../../types'
import { formatRelativeOrShortTime } from '../../utils'
import { toneColor } from './helpers'

export function SentimentCard({ sentiment }: { sentiment: NewsSentiment }) {
  const styles = useStyles()
  const { palette } = useTheme()
  const accent = sentiment.label === '긍정' ? '#dc2626' : sentiment.label === '부정' ? '#2563eb' : palette.inkMuted
  const bar = Math.max(2, Math.min(100, sentiment.score))

  return (
    <View style={styles.todaySentimentCard}>
      <View style={styles.todaySentimentHead}>
        <Text style={styles.todaySentimentMarket}>{sentiment.market === 'KR' ? '🇰🇷 한국' : '🇺🇸 미국'}</Text>
        <Text style={[styles.todaySentimentLabel, { color: accent }]}>{sentiment.label}</Text>
        <Text style={[styles.todaySentimentScore, { color: accent }]}>{sentiment.score}</Text>
      </View>
      <View style={styles.todaySentimentBarTrack}>
        <View style={[styles.todaySentimentBarFill, { width: `${bar}%`, backgroundColor: accent }]} />
      </View>
      <View style={styles.todaySentimentMetaRow}>
        <Text style={styles.todaySentimentMeta}>긍정 {sentiment.positiveCount}</Text>
        <Text style={styles.todaySentimentMeta}>중립 {sentiment.neutralCount}</Text>
        <Text style={styles.todaySentimentMeta}>부정 {sentiment.negativeCount}</Text>
      </View>
      <Text style={styles.todaySentimentRationale}>{sentiment.rationale}</Text>
      {sentiment.highlights.slice(0, Platform.OS === 'web' ? 12 : 6).map((h, i) => {
        const when = formatRelativeOrShortTime(h.publishedAt)
        return (
          <Pressable
            key={`${sentiment.market}-${i}`}
            onPress={() => h.url && void Linking.openURL(h.url)}
            style={styles.todayHeadlineRow}
          >
            <View style={[styles.todayHeadlineDot, { backgroundColor: toneColor(h.tone) }]} />
            <Text style={styles.todayHeadlineText} numberOfLines={2}>{h.title}</Text>
            <Text style={styles.todayHeadlineSource}>
              {when ? `${h.source} · ${when}` : h.source}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
