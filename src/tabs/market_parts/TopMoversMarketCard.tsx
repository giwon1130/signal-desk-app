import { Pressable, Text, View } from 'react-native'
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
  const head = gainers[0]

  return (
    <CollapsibleCard
      title={
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>{flag} 급등락</Text>
          <Text style={[styles.metaText, { marginLeft: 6 }]}>{scope}</Text>
        </View>
      }
      preview={
        <Text style={[styles.metaText, { color: palette.up, fontWeight: '700' }]}>
          {head ? `${head.name} ${formatSignedRate(head.changeRate)}` : '-'}
        </Text>
      }
    >
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Column title="급등" Icon={Flame} color={palette.up} items={gainers} market={market} onOpenDetail={onOpenDetail} palette={palette} />
        <View style={{ width: 1, backgroundColor: palette.border }} />
        <Column title="급락" Icon={Snowflake} color={palette.down} items={losers} market={market} onOpenDetail={onOpenDetail} palette={palette} />
      </View>
    </CollapsibleCard>
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
