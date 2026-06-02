/**
 * 뉴스 히어로 — 오늘 탭 상단의 큰 뉴스 카드.
 * 시장별 뉴스 심리(점수)를 칩으로, 실제 헤드라인을 ~3.5초마다 페이드로 회전 노출.
 * KR/US 헤드라인을 번갈아 보여줘 "내용이 굴러가며" 한 화면에 들어온다.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Linking, Pressable, Text, View } from 'react-native'
import { ChevronLeft, ChevronRight, Newspaper } from 'lucide-react-native'
import { useTheme } from '../../theme'
import type { NewsSentiment } from '../../types'
import { formatRelativeOrShortTime } from '../../utils'
import { toneColor } from './helpers'

type Props = {
  sentiments: NewsSentiment[]
}

type Item = { market: string; title: string; source: string; tone: string; url: string; when: string }

export function NewsHero({ sentiments }: Props) {
  const { palette } = useTheme()
  const opacity = useRef(new Animated.Value(1)).current
  const [i, setI] = useState(0)

  // KR/US 헤드라인을 라운드로빈으로 섞어 골고루 회전.
  const items = useMemo<Item[]>(() => {
    const lists = sentiments.map((s) =>
      (s.highlights ?? []).map((h) => ({
        market: s.market,
        title: h.title,
        source: h.source,
        tone: h.tone,
        url: h.url,
        when: formatRelativeOrShortTime(h.publishedAt),
      })),
    )
    const out: Item[] = []
    const max = Math.max(0, ...lists.map((l) => l.length))
    for (let k = 0; k < max; k++) for (const l of lists) if (l[k]) out.push(l[k])
    return out.slice(0, 12)
  }, [sentiments])

  const fadeTo = (next: number) => {
    Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
      setI(next)
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }).start()
    })
  }

  useEffect(() => {
    if (items.length <= 1) return
    const id = setInterval(() => fadeTo((i + 1) % items.length), 3500)
    return () => clearInterval(id)
  }, [items.length, i])

  useEffect(() => { if (i >= items.length) setI(0) }, [items.length, i])

  if (sentiments.length === 0) return null
  const cur = items.length > 0 ? items[Math.min(i, items.length - 1)] : null

  return (
    <View style={{
      backgroundColor: palette.surface, borderRadius: 18, borderWidth: 1, borderColor: palette.border,
      padding: 16, gap: 12,
    }}>
      {/* ── 헤더: 제목 + 시장별 심리 칩 ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Newspaper size={15} color="#0d9488" strokeWidth={2.6} />
        <Text style={{ color: palette.ink, fontSize: 14, fontWeight: '900' }}>오늘의 뉴스</Text>
        <View style={{ flex: 1 }} />
        {sentiments.map((s) => {
          const accent = s.label === '긍정' ? palette.up : s.label === '부정' ? palette.down : palette.inkMuted
          return (
            <View key={s.market} style={{
              flexDirection: 'row', alignItems: 'center', gap: 4,
              backgroundColor: palette.surfaceAlt, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4,
            }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: palette.inkMuted }}>{s.market === 'KR' ? '🇰🇷' : '🇺🇸'}</Text>
              <Text style={{ fontSize: 11, fontWeight: '900', color: accent }}>{s.label} {s.score}</Text>
            </View>
          )
        })}
      </View>

      {/* ── 회전 헤드라인 (내용이 번갈아 보임) ── */}
      {cur ? (
        <Pressable
          onPress={() => { if (cur.url) void Linking.openURL(cur.url) }}
          accessibilityRole="button"
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Animated.View style={{ opacity, gap: 7, minHeight: 78, justifyContent: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: toneColor(cur.tone) }} />
              <Text style={{ color: toneColor(cur.tone), fontSize: 11, fontWeight: '900' }}>{cur.tone}</Text>
              <Text style={{ color: palette.inkFaint, fontSize: 11 }}>
                {cur.market === 'KR' ? '🇰🇷' : '🇺🇸'} {cur.source}{cur.when ? ` · ${cur.when}` : ''}
              </Text>
            </View>
            <Text style={{ color: palette.ink, fontSize: 16, fontWeight: '800', lineHeight: 23 }} numberOfLines={3}>
              {cur.title}
            </Text>
          </Animated.View>
        </Pressable>
      ) : (
        <Text style={{ color: palette.inkFaint, fontSize: 12, paddingVertical: 12 }}>표시할 헤드라인이 없습니다</Text>
      )}

      {/* ── 회전 컨트롤 ── */}
      {items.length > 1 ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderTopWidth: 1, borderTopColor: palette.border, paddingTop: 10 }}>
          <Pressable onPress={() => fadeTo((i - 1 + items.length) % items.length)} hitSlop={8} accessibilityLabel="이전 뉴스" style={{ padding: 2 }}>
            <ChevronLeft size={18} color={palette.inkMuted} strokeWidth={2.5} />
          </Pressable>
          <Text style={{ color: palette.inkFaint, fontSize: 11, fontWeight: '700', marginHorizontal: 6, fontVariant: ['tabular-nums'] }}>
            {Math.min(i, items.length - 1) + 1} / {items.length}
          </Text>
          <Pressable onPress={() => fadeTo((i + 1) % items.length)} hitSlop={8} accessibilityLabel="다음 뉴스" style={{ padding: 2 }}>
            <ChevronRight size={18} color={palette.inkMuted} strokeWidth={2.5} />
          </Pressable>
        </View>
      ) : null}
    </View>
  )
}
