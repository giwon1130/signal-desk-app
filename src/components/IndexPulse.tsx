import { Pressable, ScrollView, Text, View } from 'react-native'
import { useTheme } from '../theme'
import type { MarketKey, MarketSectionsData } from '../types'
import { formatNumber, formatSignedRate } from '../utils'

type Props = {
  sections: MarketSectionsData | null
  marketPreference: 'KR' | 'US' | 'BOTH'
  /** 현재 보이는 지수(시장/라벨)로 상세 열기. */
  onPress?: (market: MarketKey, label: string) => void
}

type Idx = { market: MarketKey; label: string; value: number; changeRate: number }

/** 자동 회전 없이 지수를 비교한다. 숫자는 부호와 색을 함께 사용한다. */
export function IndexPulse({ sections, marketPreference, onPress }: Props) {
  const { palette } = useTheme()

  const showKr = marketPreference !== 'US'
  const showUs = marketPreference !== 'KR'
  const items: Idx[] = []
  if (showKr) for (const it of sections?.koreaMarket?.indices ?? []) items.push({ market: 'KR', label: it.label, value: it.value, changeRate: it.changeRate })
  if (showUs) for (const it of sections?.usMarket?.indices ?? []) items.push({ market: 'US', label: it.label, value: it.value, changeRate: it.changeRate })

  if (items.length === 0) return null

  return (
    <View style={{ borderTopWidth: 1, borderTopColor: palette.borderLight, backgroundColor: palette.bg }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 8 }}>
        {items.map((item) => {
          const valid = Number.isFinite(item.value) && item.value > 0 && Number.isFinite(item.changeRate)
          const color = !valid ? palette.inkMuted : item.changeRate > 0 ? palette.up : item.changeRate < 0 ? palette.down : palette.inkMuted
          return (
            <Pressable key={`${item.market}-${item.label}`} disabled={!onPress}
              accessibilityRole={onPress ? 'button' : undefined}
              accessibilityLabel={`${item.label}, ${valid ? `${formatNumber(item.value, 2)}, ${formatSignedRate(item.changeRate)}` : '시세 확인 중'}${onPress ? ', 상세 보기' : ''}`}
              onPress={() => onPress?.(item.market, item.label)}
              style={({ pressed }) => ({ minWidth: 142, minHeight: 52, paddingHorizontal: 12, paddingVertical: 8, gap: 5, borderRadius: 10, backgroundColor: palette.surface, opacity: pressed ? 0.65 : 1 })}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                <Text style={{ color: palette.inkSub, fontSize: 12, fontWeight: '700' }}>{item.label}</Text>
                <Text style={{ color, fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{valid ? formatSignedRate(item.changeRate) : '—'}</Text>
              </View>
              <Text style={{ color: palette.ink, fontSize: 15, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{valid ? formatNumber(item.value, 2) : '확인 중'}</Text>
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}
