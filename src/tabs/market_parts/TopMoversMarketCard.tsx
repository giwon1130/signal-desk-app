import { Animated, Pressable, Text, View } from 'react-native'
import { Flame, Snowflake } from 'lucide-react-native'
import { CollapsibleCard } from '../../components/CollapsibleCard'
import { useRotatingIndex } from '../../hooks/useRotatingIndex'
import { useStyles } from '../../styles'
import { useTheme } from '../../theme'
import type { MoverReason, TopMover, TopMoversResponse } from '../../types'
import { formatSignedRate } from '../../utils'

type Props = {
  topMovers: TopMoversResponse
  moverReasons?: MoverReason[]
  market: 'KR' | 'US'
  onOpenDetail: (market: string, ticker: string, name?: string) => void
  /** 지수 상세 모달처럼 이미 그 화면이 주목적인 곳에선 펼친 채로. */
  defaultCollapsed?: boolean
}

const TOP_N = 5

/** 시장별 급등락 카드 — 급등(좌)·급락(우) 한 카드에. */
export function TopMoversMarketCard({ topMovers, moverReasons, market, onOpenDetail, defaultCollapsed }: Props) {
  const styles = useStyles()
  const { palette } = useTheme()
  const isKr = market === 'KR'

  // 급등락 사유 — ticker 기준 매핑 ("왜 올랐나/내렸나").
  const reasonByTicker: Record<string, string> = {}
  for (const r of moverReasons ?? []) reasonByTicker[r.ticker] = r.reason

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
      defaultCollapsed={defaultCollapsed}
      title={
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>{flag} 급등락</Text>
          <Text style={[styles.metaText, { marginLeft: 6 }]}>{scope}</Text>
        </View>
      }
      preview={<RotatingPreview items={rotating} palette={palette} />}
    >
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Column title="급등" Icon={Flame} color={palette.up} items={gainers} market={market} onOpenDetail={onOpenDetail} palette={palette} reasonByTicker={reasonByTicker} />
        <View style={{ width: 1, backgroundColor: palette.border }} />
        <Column title="급락" Icon={Snowflake} color={palette.down} items={losers} market={market} onOpenDetail={onOpenDetail} palette={palette} reasonByTicker={reasonByTicker} />
      </View>
    </CollapsibleCard>
  )
}

type RotItem = { name: string; rate: number; up: boolean }

/** 급등/급락을 ~2.8초마다 페이드로 번갈아 보여주는 미리보기. */
function RotatingPreview({ items, palette }: { items: RotItem[]; palette: any }) {
  const { index: i, opacity } = useRotatingIndex(items.length, 2800)

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
  title, Icon, color, items, market, onOpenDetail, palette, reasonByTicker,
}: {
  title: string
  Icon: typeof Flame
  color: string
  items: TopMover[]
  market: 'KR' | 'US'
  onOpenDetail: (market: string, ticker: string, name?: string) => void
  palette: any
  reasonByTicker: Record<string, string>
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
        items.map((m) => {
          const reason = reasonByTicker[m.ticker]
          return (
            <Pressable
              key={`${m.market}-${m.ticker}`}
              onPress={() => onOpenDetail(market, m.ticker, m.name)}
              accessibilityRole="button"
              style={({ pressed }) => ({
                paddingVertical: 6, gap: 2, opacity: pressed ? 0.6 : 1,
              })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {/* flex:1 + minWidth:0 로 긴 종목명이 말줄임되게(겹침 방지), 등락률은 flexShrink:0 으로 고정폭 보장 */}
                <Text style={{ color: palette.ink, fontSize: 12, fontWeight: '700', flex: 1, minWidth: 0 }} numberOfLines={1} ellipsizeMode="tail">{m.name}</Text>
                <Text style={{ color, fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'], flexShrink: 0 }}>{formatSignedRate(m.changeRate)}</Text>
              </View>
              {reason ? (
                <Text style={{ color: palette.inkMuted, fontSize: 10, lineHeight: 14 }} numberOfLines={2}>{reason}</Text>
              ) : null}
            </Pressable>
          )
        })
      )}
    </View>
  )
}
