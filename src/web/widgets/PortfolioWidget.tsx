import { Pressable, Text, View } from 'react-native'
import { Activity, TrendingDown, TrendingUp } from 'lucide-react-native'
import type { PortfolioSummary } from '../../types'
import { marketColor, type Palette } from '../../theme'
import { formatPrice, formatSignedPrice, formatSignedRate } from '../../utils'
import { Widget } from '../shared'

export function PortfolioWidget({
  portfolio, onOpenDetail, palette,
}: {
  portfolio: PortfolioSummary | null
  onOpenDetail: (m: string, t: string, n?: string) => void
  palette: Palette
}) {
  if (!portfolio || portfolio.positions.length === 0) {
    return (
      <Widget
        palette={palette}
        title="내 포트폴리오"
        icon={<Activity size={13} color={palette.blue} strokeWidth={2.5} />}
      >
        <View style={{ paddingVertical: 18, alignItems: 'center', gap: 4 }}>
          <Text style={{ color: palette.inkMuted, fontSize: 12 }}>보유 중인 종목이 없어</Text>
          <Text style={{ color: palette.inkFaint, fontSize: 11 }}>종목 상세에서 매수가 · 수량 입력해 등록</Text>
        </View>
      </Widget>
    )
  }
  const top3 = [...portfolio.positions].sort((a, b) => b.evaluationAmount - a.evaluationAmount).slice(0, 3)
  const totalValue = portfolio.totalValue || 1 // 0 divide 가드
  const rate = portfolio.totalProfitRate
  const rateColor = rate >= 0 ? palette.up : palette.down

  return (
    <Widget
      palette={palette}
      title="내 포트폴리오"
      icon={<Activity size={13} color={palette.blue} strokeWidth={2.5} />}
      meta={
        <Text style={{ color: palette.inkFaint, fontSize: 11, fontWeight: '700' }}>
          {portfolio.positions.length}종목
        </Text>
      }
    >
      <View style={{ gap: 4 }}>
        <Text style={{ color: palette.inkMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>
          평가금액
        </Text>
        <Text style={{ color: palette.ink, fontSize: 24, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
          {formatPrice(portfolio.totalValue, 'KR')}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {rate >= 0 ? (
            <TrendingUp size={12} color={rateColor} strokeWidth={2.5} />
          ) : (
            <TrendingDown size={12} color={rateColor} strokeWidth={2.5} />
          )}
          <Text style={{ color: rateColor, fontSize: 13, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
            {formatSignedRate(rate)}
          </Text>
          <Text style={{ color: rateColor, fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
            ({formatSignedPrice(portfolio.totalProfit, 'KR')})
          </Text>
        </View>
      </View>

      <View style={{ gap: 6, marginTop: 4 }}>
        {top3.map((p) => {
          const weight = (p.evaluationAmount / totalValue) * 100
          const pColor = marketColor(palette, p.market, p.profitRate)
          return (
            <Pressable
              key={p.id}
              onPress={() => onOpenDetail(p.market, p.ticker, p.name)}
              style={(state) => {
                const hovered = (state as { hovered?: boolean }).hovered
                return [{
                  paddingHorizontal: 8, paddingVertical: 7, borderRadius: 7,
                  backgroundColor: hovered ? palette.surfaceAlt : 'transparent',
                  gap: 4,
                }]
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text
                  numberOfLines={1}
                  style={{ color: palette.ink, fontSize: 12, fontWeight: '700', flex: 1 }}
                >
                  {p.name}
                </Text>
                <Text style={{ color: palette.inkMuted, fontSize: 10, fontWeight: '700' }}>
                  {weight.toFixed(0)}%
                </Text>
                <Text
                  style={{ color: pColor, fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'], minWidth: 58, textAlign: 'right' }}
                >
                  {formatSignedRate(p.profitRate)}
                </Text>
              </View>
              <View style={{ height: 3, borderRadius: 2, backgroundColor: palette.border, overflow: 'hidden' }}>
                <View
                  style={{
                    width: `${Math.max(2, Math.min(100, weight))}%`,
                    height: 3,
                    backgroundColor: palette.blue,
                  }}
                />
              </View>
            </Pressable>
          )
        })}
      </View>
    </Widget>
  )
}
