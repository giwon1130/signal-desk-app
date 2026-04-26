import { Pressable, Text, View } from 'react-native'
import { useStyles } from '../../styles'
import type { TopMover } from '../../types'
import { formatPrice, formatSignedRate } from '../../utils'

type Props = {
  item: TopMover
  onOpenDetail: (market: string, ticker: string, name?: string) => void
}

export function MoverRow({ item, onOpenDetail }: Props) {
  const styles = useStyles()
  const color = item.changeRate >= 0 ? '#dc2626' : '#2563eb'
  return (
    <Pressable
      onPress={() => onOpenDetail(item.market, item.ticker, item.name)}
      style={({ pressed }) => [styles.summaryRow, pressed && { opacity: 0.6 }]}
    >
      <View style={styles.metricLeft}>
        <Text style={styles.metricName}>{item.name}</Text>
        <Text style={styles.metricState}>{item.market} · {item.ticker}</Text>
      </View>
      <View style={styles.summaryValueBox}>
        <Text style={styles.metricScore}>{formatPrice(item.price, item.market)}</Text>
        <Text style={[styles.summaryDelta, { color }]}>{formatSignedRate(item.changeRate)}</Text>
      </View>
    </Pressable>
  )
}
