import { Pressable, Text, View } from 'react-native'
import { ArrowUpRight, ShieldCheck } from 'lucide-react-native'
import { useStyles } from '../../styles'
import { marketColor, useTheme } from '../../theme'
import type { HoldingPosition, MarketSessionStatus } from '../../types'
import { formatPrice, formatSignedRate } from '../../utils'
import { assessHolding } from '../../utils/holdingDecision'

type Props = {
  monitorTargets: HoldingPosition[]
  sessions: MarketSessionStatus[]
  onOpenDetail: (market: string, ticker: string, name?: string) => void
}

export function HoldingMonitor({ monitorTargets, sessions, onOpenDetail }: Props) {
  const styles = useStyles()
  const { palette } = useTheme()
  return (
    <View style={styles.card}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.cardTitleRow}>
          <ShieldCheck size={18} color={palette.teal} />
          <Text style={styles.cardTitle}>보유 종목 점검</Text>
        </View>
        <Text style={styles.metaText}>확인 우선순</Text>
      </View>
      <Text style={{ color: palette.inkMuted, fontSize: 12, lineHeight: 19 }}>
        내가 정한 목표가·손절가 기준이야. 자동 매도하지 않아.
      </Text>
      {monitorTargets.length === 0 ? (
        <Text style={styles.metaText}>종목 탭에서 보유 종목과 대응 기준을 등록해봐</Text>
      ) : monitorTargets.map((position) => {
        const decision = assessHolding(position)
        const session = sessions.find((item) => item.market === position.market)
        const isRegular = session?.isOpen === true && session.phase === 'REGULAR'
        const tone = decision.code === 'STOP_REVIEW' ? palette.red
          : decision.code === 'TARGET_REVIEW' ? palette.teal
          : decision.code === 'INVALID' || decision.code === 'CONFIGURE' ? palette.orange : palette.inkMuted
        return (
          <Pressable
            key={position.market + '-' + position.ticker + '-' + (position.id || position.name)}
            onPress={() => onOpenDetail(position.market, position.ticker, position.name)}
            accessibilityRole="button"
            accessibilityLabel={position.name + ', ' + decision.label + ', 종목 상세 보기'}
            style={({ pressed }) => ({
              gap: 12, borderWidth: 1, borderColor: palette.borderLight, borderRadius: 16,
              padding: 14, backgroundColor: pressed ? palette.surfaceAlt : palette.surface,
            })}
          >
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <View style={{ flex: 1, gap: 5 }}>
                <Text style={{ color: palette.ink, fontSize: 16, fontWeight: '800' }}>{position.name}</Text>
                <Text style={{ color: palette.inkMuted, fontSize: 11 }}>{position.market} · {position.ticker} · {position.quantity}주</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={{ color: marketColor(palette, position.market, position.profitRate), fontSize: 17, fontWeight: '800', fontVariant: ['tabular-nums'] }}>
                  {Number.isFinite(position.profitRate) ? formatSignedRate(position.profitRate) : '—'}
                </Text>
                <Text style={{ color: palette.inkSub, fontSize: 12 }}>{formatPrice(position.currentPrice, position.market)}</Text>
              </View>
            </View>
            <View style={{ backgroundColor: palette.surfaceAlt, borderRadius: 12, padding: 12, gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: tone }} />
                <Text style={{ flex: 1, color: tone, fontSize: 13, fontWeight: '800' }}>{decision.label}</Text>
                <ArrowUpRight size={15} color={palette.inkMuted} />
              </View>
              <Text style={{ color: palette.inkSub, fontSize: 12, lineHeight: 19 }}>{decision.detail}</Text>
              {!isRegular ? (
                <Text style={{ color: palette.inkMuted, fontSize: 11, lineHeight: 17 }}>
                  {session ? '정규장 밖이야 · 개장 후 최신 시세로 다시 확인해봐' : '장 상태를 확인할 수 없어 · 시세와 거래 시간을 확인해봐'}
                </Text>
              ) : null}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <Text style={{ color: palette.inkMuted, fontSize: 11 }}>목표 {position.targetPrice != null ? formatPrice(position.targetPrice, position.market) : '미설정'}</Text>
              <Text style={{ color: palette.inkMuted, fontSize: 11 }}>손절 {position.stopLossPrice != null ? formatPrice(position.stopLossPrice, position.market) : '미설정'}</Text>
            </View>
          </Pressable>
        )
      })}
    </View>
  )
}
