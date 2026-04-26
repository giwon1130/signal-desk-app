import { Text, View } from 'react-native'
import { Brain, TrendingDown, TrendingUp } from 'lucide-react-native'
import { useStyles } from '../../styles'
import type { HoldingPosition } from '../../types'
import { formatPrice, formatSignedRate } from '../../utils'

/**
 * 보유 종목 모니터 카드.
 *
 * 휴리스틱 가이드:
 *  - +3%↑ 익절 구간
 *  - -3%↓ 손절 구간
 *  - 그 사이 관찰 구간
 *
 * 휴장이면 "다음 개장 후 시나리오 점검" 톤으로 다운그레이드.
 */
type Props = {
  monitorTargets: HoldingPosition[]
  marketClosedToday: boolean
}

export function HoldingMonitor({ monitorTargets, marketClosedToday }: Props) {
  const styles = useStyles()
  return (
    <View style={styles.card}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.cardTitleRow}>
          <Brain size={14} color="#7c3aed" strokeWidth={2.5} />
          <Text style={styles.cardTitle}>보유 종목 모니터</Text>
        </View>
        <Text style={styles.metaText}>액션 가능한 {monitorTargets.length}건</Text>
      </View>
      {monitorTargets.length === 0 ? (
        <Text style={styles.metaText}>지금 액션이 필요한 종목은 없어.</Text>
      ) : monitorTargets.map((p) => {
        const isProfit = p.profitRate >= 0
        const Icon = isProfit ? TrendingUp : TrendingDown
        const color = isProfit ? '#dc2626' : '#2563eb'
        const advice = marketClosedToday
          ? (p.profitRate >= 3 ? '휴장 중 — 다음 개장 후 분할 매도 시나리오 점검'
            : p.profitRate <= -3 ? '휴장 중 — 다음 개장 후 손절 라인 재확인'
            : '휴장 중 — 별도 액션 없음')
          : (p.profitRate >= 3 ? '익절 구간 — 분할 매도 고려' :
             p.profitRate <= -3 ? '손절 구간 — 손절 라인 점검' :
             '관찰 구간 — 다음 시그널 기다리기')
        return (
          <View key={`${p.market}-${p.ticker}-${p.id || p.name}`} style={styles.todayMonitorRow}>
            <View style={styles.todayMonitorLeft}>
              <Text style={styles.todayMonitorName}>{p.name}</Text>
              <Text style={styles.todayMonitorMeta}>{p.market} · {p.ticker} · {p.quantity}주</Text>
              <Text style={styles.todayMonitorAdvice}>{advice}</Text>
            </View>
            <View style={styles.todayMonitorRight}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Icon size={13} color={color} strokeWidth={2.5} />
                <Text style={[styles.todayMonitorRate, { color }]}>{formatSignedRate(p.profitRate)}</Text>
              </View>
              <Text style={styles.todayMonitorPrice}>{formatPrice(p.currentPrice, p.market)}</Text>
            </View>
          </View>
        )
      })}
    </View>
  )
}
