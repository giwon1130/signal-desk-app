import { useEffect, useRef, useState } from 'react'
import { Animated, Pressable, Text, View } from 'react-native'
import { Flame, Snowflake } from 'lucide-react-native'
import { CollapsibleCard } from '../../components/CollapsibleCard'
import { useStyles } from '../../styles'
import { useTheme } from '../../theme'
import type { TopMover, TopMoversResponse } from '../../types'
import { formatSignedRate } from '../../utils'

type Props = {
  topMovers: TopMoversResponse
  market: 'KR' | 'US'
  onOpenDetail: (market: string, ticker: string, name?: string) => void
}

const TOP_N = 5

/** 시장별 급등락 카드 — 급등(좌)·급락(우) 한 카드에. */
export function TopMoversMarketCard({ topMovers, market, onOpenDetail }: Props) {
  const styles = useStyles()
  const { palette } = useTheme()
  const isKr = market === 'KR'

  const gainers: TopMover[] = isKr
    ? [...topMovers.kospi.gainers, ...topMovers.kosdaq.gainers].sort((a, b) => b.changeRate - a.changeRate).slice(0, TOP_N)
    : (topMovers.us?.gainers ?? []).slice(0, TOP_N)
  const losers: TopMover[] = isKr
    ? [...topMovers.kospi.losers, ...topMovers.kosdaq.losers].sort((a, b) => a.changeRate - b.changeRate).slice(0, TOP_N)
    : (topMovers.us?.losers ?? []).slice(0, TOP_N)

  if (gainers.length === 0 && losers.length === 0) return null

  const flag = isKr ? '🇰🇷' : '🇺🇸'
  const scope = isKr ? 'KOSPI · KOSDAQ' : 'NASDAQ · NYSE'

  // 미리보기 회전 — 급등/급락 top3 를 번갈아(g0,l0,g1,l1,…) 페이드로 보여준다.
  const rotating: RotItem[] = []
  for (let i = 0; i < 3; i++) {
    if (gainers[i]) rotating.push({ name: gainers[i].name, rate: gainers[i].changeRate, up: true })
    if (losers[i]) rotating.push({ name: losers[i].name, rate: losers[i].changeRate, up: false })
  }

  return (
    <CollapsibleCard
      title={
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>{flag} 급등락</Text>
          <Text style={[styles.metaText, { marginLeft: 6 }]}>{scope}</Text>
        </View>
      }
      preview={<RotatingPreview items={rotating} palette={palette} />}
    >
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Column title="급등" Icon={Flame} color={palette.up} items={gainers} market={market} onOpenDetail={onOpenDetail} palette={palette} />
        <View style={{ width: 1, backgroundColor: palette.border }} />
        <Column title="급락" Icon={Snowflake} color={palette.down} items={losers} market={market} onOpenDetail={onOpenDetail} palette={palette} />
      </View>
    </CollapsibleCard>
  )
}

type RotItem = { name: string; rate: number; up: boolean }

/** 급등/급락을 ~2.8초마다 페이드로 번갈아 보여주는 미리보기. */
function RotatingPreview({ items, palette }: { items: RotItem[]; palette: any }) {
  const [i, setI] = useState(0)
  const opacity = useRef(new Animated.Value(1)).current

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

  if (items.length === 0) return <Text style={{ color: palette.inkFaint, fontSize: 12 }}>-</Text>
  const cur = items[i] ?? items[0]
  const color = cur.up ? palette.up : palette.down
  return (
    <Animated.Text style={{ opacity, color, fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] }} numberOfLines={1}>
      {cur.name} {formatSignedRate(cur.rate)}
    </Animated.Text>
  )
}

function Column({
  title, Icon, color, items, market, onOpenDetail, palette,
}: {
  title: string
  Icon: typeof Flame
  color: string
  items: TopMover[]
  market: 'KR' | 'US'
  onOpenDetail: (market: string, ticker: string, name?: string) => void
  palette: any
}) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
        <Icon size={12} color={color} strokeWidth={2.5} />
        <Text style={{ color, fontSize: 11, fontWeight: '900' }}>{title}</Text>
      </View>
      {items.length === 0 ? (
        <Text style={{ color: palette.inkFaint, fontSize: 11, paddingVertical: 6 }}>-</Text>
      ) : (
        items.map((m) => (
          <Pressable
            key={`${m.market}-${m.ticker}`}
            onPress={() => onOpenDetail(market, m.ticker, m.name)}
            accessibilityRole="button"
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6,
              paddingVertical: 6, opacity: pressed ? 0.6 : 1,
            })}
          >
            <Text style={{ color: palette.ink, fontSize: 12, fontWeight: '700', flex: 1 }} numberOfLines={1}>{m.name}</Text>
            <Text style={{ color, fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{formatSignedRate(m.changeRate)}</Text>
          </Pressable>
        ))
      )}
    </View>
  )
}
