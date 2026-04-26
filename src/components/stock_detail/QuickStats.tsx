import { Text, View } from 'react-native'
import { useStyles } from '../../styles'
import type { HoldingPosition } from '../../types'
import { formatSignedRate } from '../../utils'

type Props = {
  hasWatch: boolean
  position?: HoldingPosition
}

export function QuickStats({ hasWatch, position }: Props) {
  const styles = useStyles()
  const hasPosition = !!position
  return (
    <View style={[styles.quickStatsRow, { marginTop: 12 }]}>
      <View style={styles.quickStatCard}>
        <Text style={styles.kpiLabel}>관심종목</Text>
        <Text style={[styles.quickStatValue, { color: hasWatch ? '#0d9488' : '#94a3b8' }]}>
          {hasWatch ? '담김' : '미등록'}
        </Text>
        <Text style={styles.metaText}>
          {hasWatch ? '추적 중' : '아래 버튼으로 한 번에 추가'}
        </Text>
      </View>
      <View style={styles.quickStatCard}>
        <Text style={styles.kpiLabel}>실제 보유</Text>
        <Text style={[styles.quickStatValue, { color: hasPosition ? '#dc2626' : '#94a3b8' }]}>
          {hasPosition ? '보유' : '미보유'}
        </Text>
        <Text style={styles.metaText}>
          {hasPosition
            ? `${position!.quantity}주 · ${formatSignedRate(position!.profitRate)}`
            : '매수가·수량 입력 시 자동 계산'}
        </Text>
      </View>
    </View>
  )
}
