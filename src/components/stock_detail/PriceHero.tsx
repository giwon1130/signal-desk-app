import { Text, View } from 'react-native'
import { Radio } from 'lucide-react-native'
import { useStyles } from '../../styles'
import { marketColor, useTheme } from '../../theme'
import type { StockSearchResult } from '../../types'
import { formatPrice, formatSignedRate } from '../../utils'
import { PriceFlash } from '../effects'

type Props = {
  base: StockSearchResult
  livePrice: number
  liveChange: number
  isLive: boolean
}

export function PriceHero({ base, livePrice, liveChange, isLive }: Props) {
  const styles = useStyles()
  const { palette } = useTheme()
  return (
    <View style={styles.stockDetailHero}>
      <View style={styles.metricLeft}>
        <Text style={styles.kpiLabel}>{base.quoteInfo?.session === 'CLOSE' ? '최근 종가' : base.market === 'US' && !base.quoteInfo ? '기준 시각 미확인' : '현재가'}</Text>
        <Text style={styles.cardNote}>{base.stance || '관찰 대상'}</Text>
      </View>
      <View style={styles.summaryValueBox}>
        <View style={styles.cardTitleRow}>
          <PriceFlash value={isLive ? livePrice : null} upColor={palette.up} downColor={palette.down}>
            <Text style={styles.stockDetailPrice}>{livePrice > 0 ? formatPrice(livePrice, base.market) : '시세 확인 중'}</Text>
          </PriceFlash>
          {isLive ? <Radio size={12} color="#10b981" strokeWidth={2.5} /> : null}
        </View>
        <Text style={[styles.summaryDelta, { color: marketColor(palette, base.market, liveChange) }]}>
          {livePrice > 0 ? formatSignedRate(liveChange) : '등락 확인 중'}
        </Text>
      </View>
    </View>
  )
}
