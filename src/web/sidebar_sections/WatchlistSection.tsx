import { Pressable, Text, View } from 'react-native'
import { Radio, Star } from 'lucide-react-native'
import type { WatchItem } from '../../types'
import { marketColor, type Palette } from '../../theme'
import { formatPrice, formatSignedRate } from '../../utils'
import type { useLivePrices } from '../../hooks/useLivePrices'
import { StanceTag } from '../shared'
import { EmptyRow, Section } from './Section'

export const WATCHLIST_CAP = 7

type LivePrices = ReturnType<typeof useLivePrices>

type Props = {
  watchlist: WatchItem[]
  livePrices: LivePrices
  onOpenDetail: (market: string, ticker: string, name?: string) => void
  onGotoStocks: () => void
  palette: Palette
}

export function WatchlistSection({ watchlist, livePrices, onOpenDetail, onGotoStocks, palette }: Props) {
  const topWatch = watchlist.slice(0, WATCHLIST_CAP)
  return (
    <Section
      icon={<Star size={13} color="#f59e0b" strokeWidth={2.5} fill={watchlist.length ? '#f59e0b' : 'none'} />}
      title="관심종목"
      meta={`${watchlist.length}개`}
      onMoreLabel="전체 보기"
      onMore={onGotoStocks}
      palette={palette}
    >
      {topWatch.length === 0 ? (
        <EmptyRow text="아직 관심종목이 없어" hint="종목 탭에서 ☆ 눌러 담아봐" palette={palette} />
      ) : (
        topWatch.map((w) => {
          const live = w.market === 'KR' ? livePrices[w.ticker] : null
          const price = live?.price ?? w.price
          const rate  = live?.changeRate ?? w.changeRate
          const isLive = !!live
          const color = marketColor(palette, w.market, rate)
          return (
            <Pressable
              key={`${w.market}-${w.ticker}`}
              onPress={() => onOpenDetail(w.market, w.ticker, w.name)}
              style={(state) => {
                const hovered = (state as { hovered?: boolean }).hovered
                return [{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 7,
                  borderRadius: 7,
                  backgroundColor: hovered ? palette.surfaceAlt : 'transparent',
                }]
              }}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Text
                    numberOfLines={1}
                    style={{ color: palette.ink, fontSize: 12, fontWeight: '800', flexShrink: 1 }}
                  >
                    {w.name}
                  </Text>
                  {isLive ? (
                    <Radio size={8} color="#10b981" strokeWidth={3} />
                  ) : w.market === 'US' ? (
                    <Text style={{ color: palette.inkFaint, fontSize: 9, fontWeight: '700', letterSpacing: 0.3 }}>지연</Text>
                  ) : null}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ color: palette.inkFaint, fontSize: 10, fontWeight: '600' }}>
                    {w.market} · {w.ticker}
                  </Text>
                  {w.stance ? <StanceTag stance={w.stance} palette={palette} size="xs" /> : null}
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text
                  style={{
                    color: palette.ink,
                    fontSize: 12,
                    fontWeight: '700',
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {formatPrice(price, w.market)}
                </Text>
                <Text
                  style={{
                    color,
                    fontSize: 11,
                    fontWeight: '800',
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {formatSignedRate(rate)}
                </Text>
              </View>
            </Pressable>
          )
        })
      )}
    </Section>
  )
}
