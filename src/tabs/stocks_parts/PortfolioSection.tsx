import { Pressable, Text, View } from 'react-native'
import { Briefcase, Radio } from 'lucide-react-native'
import { useStyles } from '../../styles'
import { marketColor, useTheme } from '../../theme'
import type { PortfolioSummary } from '../../types'
import { formatPrice, formatSignedPrice, formatSignedRate } from '../../utils'

type LiveOf = (market: string, ticker: string, fallbackPrice: number, fallbackRate: number) =>
  { price: number; changeRate: number; live: boolean }

type Props = {
  portfolio: PortfolioSummary | null
  liveOf: LiveOf
  onOpenDetail: (market: string, ticker: string, name?: string) => void
}

export function PortfolioSection({ portfolio, liveOf, onOpenDetail }: Props) {
  const styles = useStyles()
  const { palette } = useTheme()
  const positions = portfolio?.positions ?? []

  return (
    <View style={styles.card}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.cardTitleRow}>
          <Briefcase size={14} color={palette.blue} strokeWidth={2.5} />
          <Text style={styles.cardTitle}>내 보유</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.metaText}>{positions.length}개</Text>
          {portfolio && positions.length > 0 ? (
            <Text style={[styles.metaText, {
              color: portfolio.totalProfit >= 0 ? palette.up : palette.down,
              fontWeight: '800',
            }]}>
              {formatSignedPrice(portfolio.totalProfit, 'KR')} ({formatSignedRate(portfolio.totalProfitRate)})
            </Text>
          ) : null}
        </View>
      </View>
      {positions.length ? (
        positions.map((p) => {
          const live = liveOf(p.market, p.ticker, p.currentPrice, 0)
          const livePrice = live.price
          const profitRate = p.buyPrice === 0 ? p.profitRate : ((livePrice - p.buyPrice) / p.buyPrice) * 100
          const profitAmount = (livePrice - p.buyPrice) * p.quantity
          const evaluationAmount = livePrice * p.quantity
          const profitColor = marketColor(palette, p.market, profitRate)
          return (
            <Pressable
              key={p.id}
              onPress={() => onOpenDetail(p.market, p.ticker, p.name)}
              style={({ pressed }) => [
                styles.summaryRow, pressed && { opacity: 0.6 },
              ]}
            >
              <View style={styles.metricLeft}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.metricName}>{p.name}</Text>
                  {live.live ? <Radio size={10} color="#10b981" strokeWidth={3} /> : null}
                </View>
                <Text style={styles.metricState}>
                  {p.market} · {p.ticker} · {p.quantity}주 × {formatPrice(p.buyPrice, p.market)}
                </Text>
              </View>
              <View style={styles.summaryValueBox}>
                <Text style={styles.metricScore}>{formatPrice(evaluationAmount, p.market)}</Text>
                <Text style={[styles.summaryDelta, { color: profitColor }]}>
                  {formatSignedRate(profitRate)}
                </Text>
                <Text style={[styles.cardNote, { color: profitColor }]}>
                  {formatSignedPrice(profitAmount, p.market)}
                </Text>
              </View>
            </Pressable>
          )
        })
      ) : (
        <View style={{ alignItems: 'center', gap: 8, paddingVertical: 18 }}>
          <Text style={{ color: palette.inkMuted, fontSize: 12, fontWeight: '600' }}>
            보유 중인 종목이 없어
          </Text>
          <Text style={{ color: palette.inkFaint, fontSize: 11, textAlign: 'center' }}>
            종목 상세에서 매수가 · 수량 입력해 등록
          </Text>
        </View>
      )}
    </View>
  )
}
