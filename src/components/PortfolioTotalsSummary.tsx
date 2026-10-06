import { Text, View } from 'react-native'
import type { HoldingPosition } from '../types'
import { useTheme, marketColor } from '../theme'
import { portfolioTotals } from '../utils/portfolioTotals'
import { formatPrice, formatSignedPrice, formatSignedRate } from '../utils'

export function PortfolioTotalsSummary({ positions }: { positions: HoldingPosition[] }) {
  const { palette } = useTheme()
  const totals = portfolioTotals(positions, p => p.currentPrice)
  return <View style={{ gap: 8, paddingVertical: 6 }}>
    {totals.map(t => <View key={t.market} style={{ gap: 3 }}>
      <Text style={{ color: palette.inkMuted, fontSize: 11 }}>{t.market === 'US' ? '미국 · USD' : '국내 · KRW'} 평가금액</Text>
      <Text style={{ color: palette.ink, fontSize: 19, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{t.invalid ? '가격 확인 필요' : formatPrice(t.value, t.market)}</Text>
      <Text style={{ color: t.invalid ? palette.inkMuted : marketColor(palette, t.market, t.profit), fontSize: 12 }}>
        {t.invalid ? '유효한 시세가 부족해 합계를 표시하지 않습니다.' : `${formatSignedPrice(t.profit, t.market)} (${formatSignedRate(t.rate)})`}
      </Text>
    </View>)}
    {totals.length > 1 && <Text style={{ color: palette.inkFaint, fontSize: 10 }}>환율을 적용하지 않은 통화별 합계입니다.</Text>}
  </View>
}
