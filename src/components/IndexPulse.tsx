import { useEffect, useRef, useState } from 'react'
import { Animated, Pressable, Text, View } from 'react-native'
import { Activity } from 'lucide-react-native'
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

/**
 * 상단 지수 펄스 — 선호 시장 지수(코스피/코스닥/나스닥/S&P)를 ~2.8초마다
 * 페이드로 번갈아 한 줄에 보여준다. (급등락 미리보기 회전과 동일 톤)
 */
export function IndexPulse({ sections, marketPreference, onPress }: Props) {
  const { palette } = useTheme()
  const [i, setI] = useState(0)
  const opacity = useRef(new Animated.Value(1)).current

  const showKr = marketPreference !== 'US'
  const showUs = marketPreference !== 'KR'
  const items: Idx[] = []
  if (showKr) for (const it of sections?.koreaMarket?.indices ?? []) items.push({ market: 'KR', label: it.label, value: it.value, changeRate: it.changeRate })
  if (showUs) for (const it of sections?.usMarket?.indices ?? []) items.push({ market: 'US', label: it.label, value: it.value, changeRate: it.changeRate })

  useEffect(() => {
    if (items.length <= 1) return
    const id = setInterval(() => {
      Animated.timing(opacity, { toValue: 0, duration: 280, useNativeDriver: true }).start(() => {
        setI((p) => (p + 1) % items.length)
        Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }).start()
      })
    }, 2800)
    return () => clearInterval(id)
  }, [items.length, opacity])

  if (items.length === 0) return null
  const cur = items[i] ?? items[0]
  const color = cur.changeRate > 0 ? palette.up : cur.changeRate < 0 ? palette.down : palette.inkMuted

  return (
    <Pressable
      onPress={() => onPress?.(cur.market, cur.label)}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 16, paddingVertical: 7,
        borderTopWidth: 1, borderTopColor: palette.border,
        backgroundColor: palette.surface,
      }}
    >
      <Activity size={13} color={palette.inkMuted} strokeWidth={2.5} />
      <Text style={{ color: palette.inkMuted, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 }}>지수</Text>
      <View style={{ flex: 1 }} />
      <Animated.View style={{ opacity, flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
        <Text style={{ color: palette.ink, fontSize: 12, fontWeight: '800' }}>{cur.label}</Text>
        <Text style={{ color: palette.ink, fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
          {formatNumber(cur.value, 2)}
        </Text>
        <Text style={{ color, fontSize: 12, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
          {formatSignedRate(cur.changeRate)}
        </Text>
      </Animated.View>
    </Pressable>
  )
}
