import { Linking, Pressable, Text, View } from 'react-native'
import { ExternalLink, Newspaper, Sunrise, Tv } from 'lucide-react-native'
import { CollapsibleCard } from '../../components/CollapsibleCard'
import { useStyles } from '../../styles'
import { useTheme } from '../../theme'
import type { MediaSummaryItem } from '../../types'

type Props = {
  item: MediaSummaryItem
  onTickerPress?: (ticker: string) => void
  defaultCollapsed?: boolean
}

const sentimentLabel = (s: MediaSummaryItem['sentiment']) =>
  s === 'BULLISH' ? '강세' : s === 'BEARISH' ? '약세' : '관망'

export function MediaSummaryCard({ item, onTickerPress, defaultCollapsed }: Props) {
  const styles = useStyles()
  const { palette } = useTheme()
  const isBrief = item.source === 'MORNING_BRIEF'
  const isDigest = item.source === 'NEWS_DIGEST'
  const Icon = isBrief ? Sunrise : isDigest ? Newspaper : Tv

  const accent =
    item.sentiment === 'BULLISH' ? palette.up
      : item.sentiment === 'BEARISH' ? palette.down
        : palette.blue
  const accentBg =
    item.sentiment === 'BULLISH' ? palette.upSoft
      : item.sentiment === 'BEARISH' ? palette.downSoft
        : palette.orangeSoft

  // publishedAt: "2026-05-15T03:36:36Z" → "5/15 12:36"
  const publishedLabel = (() => {
    const d = new Date(item.publishedAt)
    if (Number.isNaN(d.getTime())) return ''
    const m = d.getMonth() + 1
    const day = d.getDate()
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${m}/${day} ${hh}:${mm}`
  })()

  return (
    <CollapsibleCard
      defaultCollapsed={defaultCollapsed}
      title={
        <View style={styles.cardTitleRow}>
          <Icon size={13} color={accent} strokeWidth={2.5} />
          <Text style={[styles.cardEyebrow, { color: accent }]}>{item.channelTitle}</Text>
        </View>
      }
      preview={
        <View style={{
          paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
          backgroundColor: accentBg,
        }}>
          <Text style={{ color: accent, fontSize: 11, fontWeight: '800' }}>
            {sentimentLabel(item.sentiment)}
          </Text>
        </View>
      }
    >
      {/* ── 헤더 ── */}
      <View style={{ gap: 4, marginBottom: 8 }}>
        <Text style={{ color: palette.ink, fontSize: 14, fontWeight: '800', lineHeight: 20 }}>
          {item.videoTitle}
        </Text>
        <Text style={{ color: palette.inkMuted, fontSize: 11 }}>
          {publishedLabel}
          {!isBrief && !isDigest && !item.hasTranscript ? ' · 자막 미수신 (제목 기반 요약)' : ''}
        </Text>
      </View>

      {/* ── 요약 ── */}
      <View style={{ marginBottom: 10 }}>
        <Text style={{ color: palette.inkMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 }}>
          오늘의 요약
        </Text>
        <Text style={{ color: palette.ink, fontSize: 13, lineHeight: 20 }}>
          {item.summary}
        </Text>
      </View>

      {/* ── 흐름 분석 ── */}
      <View style={{
        backgroundColor: accentBg, borderRadius: 10, padding: 12, marginBottom: 10,
        borderLeftWidth: 3, borderLeftColor: accent,
      }}>
        <Text style={{ color: accent, fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 }}>
          시장 흐름
        </Text>
        <Text style={{ color: palette.ink, fontSize: 12, lineHeight: 18 }}>
          {item.flowAnalysis}
        </Text>
      </View>

      {/* ── 언급 종목 ── */}
      {item.keyTickers.length > 0 ? (
        <View style={{ marginBottom: 10 }}>
          <Text style={{ color: palette.inkMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 }}>
            언급된 종목
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {item.keyTickers.map((t) => (
              <Pressable
                key={t}
                onPress={() => onTickerPress?.(t)}
                style={({ pressed }) => ({
                  paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
                  backgroundColor: pressed ? palette.surfaceAlt : palette.surface,
                  borderWidth: 1, borderColor: palette.border,
                })}
              >
                <Text style={{ color: palette.ink, fontSize: 12, fontWeight: '700' }}>{t}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {/* ── 영상 링크 (MORNING_BRIEF / NEWS_DIGEST 는 링크 없음) ── */}
      {!isBrief && !isDigest && item.videoUrl ? (
        <Pressable
          onPress={() => { void Linking.openURL(item.videoUrl) }}
          style={({ pressed }) => ({
            flexDirection: 'row', alignItems: 'center', gap: 6,
            alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6,
            borderRadius: 8, backgroundColor: pressed ? palette.surfaceAlt : 'transparent',
          })}
        >
          <ExternalLink size={12} color={palette.blue} strokeWidth={2.5} />
          <Text style={{ color: palette.blue, fontSize: 12, fontWeight: '700' }}>
            유튜브에서 영상 보기
          </Text>
        </Pressable>
      ) : null}
    </CollapsibleCard>
  )
}
