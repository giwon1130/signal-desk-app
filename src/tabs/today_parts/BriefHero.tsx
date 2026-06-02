/**
 * 브리프 히어로 — 오늘 탭 최상단의 큰 뉴스 카드.
 * 모닝/마감 브리프·뉴스 종합 등 최근 미디어 요약을 ~7초마다 페이드로 회전.
 * 소스별로 중복 제거해 골고루 보여준다. 좌우 화살표로 수동 이동도 가능.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Linking, Pressable, Text, View } from 'react-native'
import { ChevronLeft, ChevronRight, ExternalLink, Moon, Newspaper, Sunrise, Tv } from 'lucide-react-native'
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

const sourceMeta = (item: MediaSummaryItem) => {
  switch (item.source) {
    case 'MORNING_BRIEF': return { label: '모닝 브리프', Icon: Sunrise }
    case 'EVENING_BRIEF': return { label: '마감 브리프', Icon: Moon }
    case 'NEWS_DIGEST': return { label: '뉴스 종합', Icon: Newspaper }
    default: return { label: item.channelTitle, Icon: Tv }
  }
}

export function BriefHero({ items, briefing, onTickerPress }: Props) {
  const { palette } = useTheme()
  const opacity = useRef(new Animated.Value(1)).current
  const [i, setI] = useState(0)

  // 소스별 중복 제거 — 같은 종류 브리프가 여러 개면 가장 최근 1건만. 골고루 노출.
  const deck = useMemo(() => {
    const seen = new Set<string>()
    const out: MediaSummaryItem[] = []
    for (const it of items) {
      if (seen.has(it.source)) continue
      seen.add(it.source)
      out.push(it)
    }
    return out.length > 0 ? out : items
  }, [items])

  const fadeTo = (next: number) => {
    Animated.timing(opacity, { toValue: 0, duration: 240, useNativeDriver: true }).start(() => {
      setI(next)
      Animated.timing(opacity, { toValue: 1, duration: 240, useNativeDriver: true }).start()
    })
  }

  useEffect(() => {
    if (deck.length <= 1) return
    const id = setInterval(() => fadeTo((i + 1) % deck.length), 7000)
    return () => clearInterval(id)
  }, [deck.length, i])

  // index 가 deck 범위를 벗어나면(목록 갱신) 보정
  useEffect(() => { if (i >= deck.length) setI(0) }, [deck.length, i])

  if (deck.length === 0) return null
  const item = deck[Math.min(i, deck.length - 1)]
  const { label: srcLabel, Icon } = sourceMeta(item)

  const accent =
    item.sentiment === 'BULLISH' ? palette.up
      : item.sentiment === 'BEARISH' ? palette.down
        : palette.blue
  const accentBg =
    item.sentiment === 'BULLISH' ? palette.upSoft
      : item.sentiment === 'BEARISH' ? palette.downSoft
        : palette.orangeSoft

  const publishedLabel = (() => {
    const d = new Date(item.publishedAt)
    if (Number.isNaN(d.getTime())) return ''
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  })()

  const isBrief = item.source === 'MORNING_BRIEF' || item.source === 'EVENING_BRIEF'
  const isDigest = item.source === 'NEWS_DIGEST'

  return (
    <View style={{
      backgroundColor: palette.surface, borderRadius: 18, borderWidth: 1, borderColor: palette.border,
      padding: 16, gap: 12,
    }}>
      {/* ── 상단: 소스 + 회전 컨트롤 ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 5,
          backgroundColor: accentBg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5,
        }}>
          <Icon size={13} color={accent} strokeWidth={2.6} />
          <Text style={{ color: accent, fontSize: 12, fontWeight: '900' }}>{srcLabel}</Text>
        </View>
        <View style={{
          backgroundColor: accentBg, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4,
        }}>
          <Text style={{ color: accent, fontSize: 11, fontWeight: '800' }}>{sentimentLabel(item.sentiment)}</Text>
        </View>
        <View style={{ flex: 1 }} />
        {deck.length > 1 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <Pressable onPress={() => fadeTo((i - 1 + deck.length) % deck.length)} hitSlop={8} accessibilityLabel="이전 뉴스" style={{ padding: 2 }}>
              <ChevronLeft size={18} color={palette.inkMuted} strokeWidth={2.5} />
            </Pressable>
            {deck.map((_, idx) => (
              <View
                key={idx}
                style={{
                  width: idx === i ? 16 : 6, height: 6, borderRadius: 999, marginHorizontal: 1.5,
                  backgroundColor: idx === i ? accent : palette.border,
                }}
              />
            ))}
            <Pressable onPress={() => fadeTo((i + 1) % deck.length)} hitSlop={8} accessibilityLabel="다음 뉴스" style={{ padding: 2 }}>
              <ChevronRight size={18} color={palette.inkMuted} strokeWidth={2.5} />
            </Pressable>
          </View>
        ) : null}
      </View>

      {/* ── 회전 콘텐츠 ── */}
      <Animated.View style={{ opacity, gap: 12 }}>
        <View style={{ gap: 4 }}>
          <Text style={{ color: palette.ink, fontSize: 18, fontWeight: '900', lineHeight: 25 }}>
            {item.videoTitle}
          </Text>
          <Text style={{ color: palette.inkFaint, fontSize: 11 }}>{publishedLabel}</Text>
        </View>

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

        {!isBrief && !isDigest && item.videoUrl ? (
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
      </Animated.View>

      {/* ── 개인화: 내 보유/관심/이벤트 + 액션 (회전과 무관하게 고정) ── */}
      {briefing ? (
        <View style={{ borderTopWidth: 1, borderTopColor: palette.border, paddingTop: 10 }}>
          <BriefingDetails briefing={briefing} />
        </View>
      ) : null}
    </View>
  )
}
