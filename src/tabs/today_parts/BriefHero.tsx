/**
 * 브리프 히어로 — 오늘 탭 상단의 브리프 카드.
 * 모닝/마감 브리프 중 "가장 최근 1건"만 보여준다(덮어쓰기, 공존·회전 없음).
 * 뉴스(NEWS_DIGEST)는 아래 NewsHero 가 담당하므로 여기서 제외한다.
 */
import { Linking, Pressable, Text, View } from 'react-native'
import { ExternalLink, Moon, Sun, Sunrise } from 'lucide-react-native'
import { useTheme } from '../../theme'
import type { DailyBriefing, MediaSummaryItem } from '../../types'
import { BriefingDetails } from './BriefingDetails'

type Props = {
  items: MediaSummaryItem[]
  briefing?: DailyBriefing | null
  onTickerPress?: (ticker: string) => void
}

const sentimentLabel = (s: MediaSummaryItem['sentiment']) =>
  s === 'BULLISH' ? '강세' : s === 'BEARISH' ? '약세' : '관망'

// 뉴스/유튜브가 아닌 모든 브리프(모닝/장중/마감/미장).
const isBriefSource = (s: MediaSummaryItem['source']) => s !== 'NEWS_DIGEST' && s !== 'YOUTUBE'

const sourceMeta = (item: MediaSummaryItem): { label: string; Icon: typeof Sunrise } => {
  switch (item.source) {
    case 'MORNING_BRIEF': return { label: '모닝 브리프', Icon: Sunrise }
    case 'MIDDAY_BRIEF': return { label: '장중 브리프', Icon: Sun }
    case 'CLOSE_BRIEF': return { label: '마감 브리프', Icon: Moon }
    case 'EVENING_BRIEF': return { label: '미장 브리프', Icon: Moon }
    default: return { label: item.channelTitle || '브리프', Icon: Sunrise }
  }
}

export function BriefHero({ items, briefing, onTickerPress }: Props) {
  const { palette } = useTheme()

  // 뉴스/유튜브 제외, 가장 최근 브리프 1건만. (items 는 최신순)
  const item = items.find((s) => isBriefSource(s.source)) ?? null

  // 브리프도 개인화도 없으면 카드 자체를 띄우지 않음.
  if (!item && !briefing) return null

  const { label: srcLabel, Icon } = item ? sourceMeta(item) : { label: '오늘의 브리핑', Icon: Sunrise }

  const accent =
    item?.sentiment === 'BULLISH' ? palette.up
      : item?.sentiment === 'BEARISH' ? palette.down
        : palette.blue
  const accentBg =
    item?.sentiment === 'BULLISH' ? palette.upSoft
      : item?.sentiment === 'BEARISH' ? palette.downSoft
        : palette.orangeSoft

  const publishedLabel = (() => {
    if (!item) return ''
    const d = new Date(item.publishedAt)
    if (Number.isNaN(d.getTime())) return ''
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  })()

  return (
    <View style={{
      backgroundColor: palette.surface, borderRadius: 18, borderWidth: 1, borderColor: palette.border,
      padding: 16, gap: 12,
    }}>
      {/* ── 상단: 소스 + 분위기 ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 5,
          backgroundColor: accentBg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5,
        }}>
          <Icon size={13} color={accent} strokeWidth={2.6} />
          <Text style={{ color: accent, fontSize: 12, fontWeight: '900' }}>{srcLabel}</Text>
        </View>
        {item ? (
          <View style={{ backgroundColor: accentBg, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 }}>
            <Text style={{ color: accent, fontSize: 11, fontWeight: '800' }}>{sentimentLabel(item.sentiment)}</Text>
          </View>
        ) : null}
        <View style={{ flex: 1 }} />
        {publishedLabel ? <Text style={{ color: palette.inkFaint, fontSize: 11 }}>{publishedLabel}</Text> : null}
      </View>

      {/* ── 브리프 본문 ── */}
      {item ? (
        <View style={{ gap: 12 }}>
          <Text style={{ color: palette.ink, fontSize: 18, fontWeight: '900', lineHeight: 25 }}>
            {item.videoTitle}
          </Text>

          <Text style={{ color: palette.ink, fontSize: 14, lineHeight: 22 }}>{item.summary}</Text>

          <View style={{
            backgroundColor: accentBg, borderRadius: 12, padding: 13,
            borderLeftWidth: 3, borderLeftColor: accent,
          }}>
            <Text style={{ color: accent, fontSize: 10, fontWeight: '900', letterSpacing: 0.5, marginBottom: 5 }}>시장 흐름</Text>
            <Text style={{ color: palette.ink, fontSize: 13, lineHeight: 20 }}>{item.flowAnalysis}</Text>
          </View>

          {item.keyTickers.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {item.keyTickers.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => onTickerPress?.(t)}
                  style={({ pressed }) => ({
                    paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999,
                    backgroundColor: pressed ? palette.surfaceAlt : palette.surface,
                    borderWidth: 1, borderColor: palette.border,
                  })}
                >
                  <Text style={{ color: palette.ink, fontSize: 12, fontWeight: '700' }}>{t}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {item.source === 'YOUTUBE' && item.videoUrl ? (
            <Pressable
              onPress={() => { void Linking.openURL(item.videoUrl) }}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
                paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
                backgroundColor: pressed ? palette.surfaceAlt : 'transparent',
              })}
            >
              <ExternalLink size={12} color={palette.blue} strokeWidth={2.5} />
              <Text style={{ color: palette.blue, fontSize: 12, fontWeight: '700' }}>유튜브에서 영상 보기</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* ── 개인화: 내 보유/관심/이벤트 + 액션 ── */}
      {briefing ? (
        <View style={item ? { borderTopWidth: 1, borderTopColor: palette.border, paddingTop: 10 } : undefined}>
          <BriefingDetails briefing={briefing} />
        </View>
      ) : null}
    </View>
  )
}
