import { useMemo } from 'react'
import { Linking, Pressable, Text, View } from 'react-native'
import { ExternalLink, Newspaper } from 'lucide-react-native'
import type { MarketSummaryData } from '../../types'
import type { Palette } from '../../theme'
import { formatRelativeOrShortTime } from '../../utils'
import { Widget } from '../shared'

export function NewsWidget({ summary, palette }: { summary: MarketSummaryData | null; palette: Palette }) {
  // KR + US 뉴스 하이라이트를 섞어서 한 줄로. 각 마켓 앞에서부터 번갈아가며.
  const items = useMemo(() => {
    if (!summary?.newsSentiments) return []
    const kr = summary.newsSentiments.find((s) => s.market === 'KR')?.highlights ?? []
    const us = summary.newsSentiments.find((s) => s.market === 'US')?.highlights ?? []
    const merged: Array<{ market: 'KR' | 'US'; h: typeof kr[number] }> = []
    const max = Math.max(kr.length, us.length)
    for (let i = 0; i < max; i++) {
      if (kr[i]) merged.push({ market: 'KR', h: kr[i] })
      if (us[i]) merged.push({ market: 'US', h: us[i] })
    }
    return merged.slice(0, 10)
  }, [summary])

  return (
    <Widget
      palette={palette}
      title="시장 뉴스"
      icon={<Newspaper size={13} color={palette.blue} strokeWidth={2.5} />}
      meta={
        <Text style={{ color: palette.inkFaint, fontSize: 11, fontWeight: '700' }}>
          {items.length}건
        </Text>
      }
    >
      {items.length === 0 ? (
        <View style={{ paddingVertical: 18, alignItems: 'center' }}>
          <Text style={{ color: palette.inkMuted, fontSize: 12 }}>뉴스 수집 중…</Text>
          <Text style={{ color: palette.inkFaint, fontSize: 11, marginTop: 4 }}>잠시 뒤 새로고침</Text>
        </View>
      ) : (
        items.map((it, i) => (
          <Pressable
            key={`${it.market}-${i}`}
            onPress={() => void Linking.openURL(it.h.url).catch(() => { /* noop */ })}
            style={(state) => {
              const hovered = (state as { hovered?: boolean }).hovered
              return [{
                flexDirection: 'row',
                gap: 8,
                paddingHorizontal: 6, paddingVertical: 7,
                borderRadius: 6,
                backgroundColor: hovered ? palette.surfaceAlt : 'transparent',
              }]
            }}
          >
            <View
              style={{
                width: 6, height: 6, borderRadius: 3, marginTop: 6,
                backgroundColor: toneDotColor(it.h.tone, palette),
              }}
            />
            <View style={{ flex: 1, gap: 2 }}>
              <Text
                numberOfLines={2}
                style={{ color: palette.ink, fontSize: 12, fontWeight: '700', lineHeight: 16 }}
              >
                {it.h.title}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ color: palette.inkFaint, fontSize: 10, fontWeight: '800' }}>
                  {it.market}
                </Text>
                <Text style={{ color: palette.inkMuted, fontSize: 10 }}>{it.h.source}</Text>
                {it.h.publishedAt ? (
                  <>
                    <Text style={{ color: palette.inkFaint, fontSize: 10 }}>·</Text>
                    <Text style={{ color: palette.inkMuted, fontSize: 10, fontVariant: ['tabular-nums'] }}>
                      {formatRelativeOrShortTime(it.h.publishedAt)}
                    </Text>
                  </>
                ) : null}
              </View>
            </View>
            <ExternalLink size={11} color={palette.inkFaint} />
          </Pressable>
        ))
      )}
    </Widget>
  )
}

function toneDotColor(tone: string, palette: Palette): string {
  if (tone === '긍정') return palette.up
  if (tone === '부정') return palette.down
  return palette.inkMuted
}
