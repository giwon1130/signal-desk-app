import { Text, View } from 'react-native'
import { Target } from 'lucide-react-native'
import { useStyles } from '../../styles'
import type { RecommendationExecutionLog } from '../../types'
import { formatSignedRate } from '../../utils'
import { userStatusLabel } from './helpers'

/**
 * 오늘의 단타 픽 카드.
 *
 * - 휴장이면 "다음 거래일 후보 미리 봐두는 용도" 안내
 * - userStatus 배지 (HELD/WATCHED/NEW) + stage 배지
 * - 기대 수익률 색상 (양수=빨강 한국 컨벤션, 음수=파랑)
 */
type Props = {
  picks: RecommendationExecutionLog[]
  marketClosedToday: boolean
}

export function PicksCard({ picks, marketClosedToday }: Props) {
  const styles = useStyles()
  return (
    <View style={styles.card}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.cardTitleRow}>
          <Target size={14} color="#dc2626" strokeWidth={2.5} />
          <Text style={styles.cardTitle}>오늘의 단타 픽</Text>
        </View>
        <Text style={styles.metaText}>{picks.length}개 후보</Text>
      </View>
      {marketClosedToday ? (
        <Text style={styles.metaText}>
          지금은 휴장이라 단타 진입은 의미 없어. 다음 거래일 후보 미리 봐두는 용도로만 활용해.
        </Text>
      ) : null}
      {picks.length === 0 ? (
        <Text style={styles.metaText}>오늘은 추천 후보가 없어. 무리해서 진입하지 말 것.</Text>
      ) : picks.map((p, i) => (
        <View key={`${p.ticker}-${i}`} style={styles.todayPickRow}>
          <View style={styles.todayPickTopLine}>
            <Text style={styles.todayPickName}>{p.name}</Text>
            <View style={styles.todayPickHeaderBadges}>
              <View style={[
                styles.pickUserStatusBadge,
                p.userStatus === 'HELD'    && styles.pickUserStatusBadgeHeld,
                p.userStatus === 'WATCHED' && styles.pickUserStatusBadgeWatched,
                (!p.userStatus || p.userStatus === 'NEW') && styles.pickUserStatusBadgeNew,
              ]}>
                <Text style={[
                  styles.pickUserStatusBadgeText,
                  p.userStatus === 'HELD'    && styles.pickUserStatusBadgeTextHeld,
                  p.userStatus === 'WATCHED' && styles.pickUserStatusBadgeTextWatched,
                ]}>
                  {userStatusLabel(p.userStatus)}
                </Text>
              </View>
              <View style={styles.todayPickStanceBadge}>
                <Text style={styles.todayPickStanceBadgeText}>{p.stage}</Text>
              </View>
            </View>
          </View>
          <Text style={styles.todayPickMeta}>{p.market} · {p.ticker}{p.confidence ? ` · 확신 ${p.confidence}%` : ''}</Text>
          <Text style={styles.todayPickRationale} numberOfLines={2}>{p.rationale}</Text>
          {p.expectedReturnRate != null ? (
            <Text style={[styles.todayPickReturn, { color: p.expectedReturnRate >= 0 ? '#dc2626' : '#2563eb' }]}>
              기대 수익률 {formatSignedRate(p.expectedReturnRate)}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  )
}
