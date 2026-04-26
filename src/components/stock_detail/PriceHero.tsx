import { Text, View } from 'react-native'
import { Radio } from 'lucide-react-native'
import { useStyles } from '../../styles'
import { marketColor, useTheme } from '../../theme'
import type { StockSearchResult } from '../../types'
import { formatPrice, formatSignedRate } from '../../utils'

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
        <Text style={styles.kpiLabel}>현재가</Text>
        <Text style={styles.cardNote}>{base.stance || '관찰 대상'}</Text>
      </View>
      <View style={styles.summaryValueBox}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.stockDetailPrice}>{formatPrice(livePrice, base.market)}</Text>
          {isLive ? <Radio size={12} color="#10b981" strokeWidth={2.5} /> : null}
        </View>
        <Text style={[styles.summaryDelta, { color: marketColor(palette, base.market, liveChange) }]}>
          {formatSignedRate(liveChange)}
        </Text>
      </View>
    </View>
  )
}
