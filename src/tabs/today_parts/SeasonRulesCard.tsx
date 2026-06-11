/**
 * 이번 달 시즌 카드 — 저장한 시즌 규칙 중 "지금 진행 중"인 것을 오늘 탭에 노출.
 * 규칙을 저장해도 푸시 한 번 오고 끝이라 모달을 열어야만 보이던 것 — 시즌 안에는 매일 보이게.
 * 진행 중 규칙이 없으면 카드 자체를 렌더하지 않는다 (비로그인 포함).
 */
import { useEffect, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { CalendarRange } from 'lucide-react-native'
import { useStyles } from '../../styles'
import { useTheme } from '../../theme'
import type { SeasonalityRule } from '../../types/backtest'
import { listSeasonalityRules } from '../../api/backtest'

type Props = {
  onOpenDetail: (market: string, ticker: string, name?: string) => void
  /** 갱신 트리거 — 부모 fetch 주기에 맞춰 다시 불러옴 (예: lastSyncedAt) */
  refreshKey?: string
}

export function SeasonRulesCard({ onOpenDetail, refreshKey }: Props) {
  const styles = useStyles()
  const { palette } = useTheme()
  const [inSeason, setInSeason] = useState<SeasonalityRule[]>([])

  useEffect(() => {
    let alive = true
    const month = new Date().getMonth() + 1
    listSeasonalityRules().then((rules) => {
      if (alive) setInSeason(rules.filter((r) => r.month === month))
    })
    return () => { alive = false }
  }, [refreshKey])

  if (inSeason.length === 0) return null

  return (
    <View style={styles.cardSection}>
      <View style={styles.cardTitleRow}>
        <CalendarRange size={14} color={palette.purple ?? '#7c3aed'} strokeWidth={2.5} />
        <Text style={styles.cardTitle}>이번 달 시즌</Text>
        <Text style={[styles.metaText, { marginLeft: 8 }]}>내가 저장한 패턴</Text>
      </View>
      <View style={{ gap: 6 }}>
        {inSeason.map((r) => {
          const buy = r.kind === 'BUY_MONTH'
          const c = buy ? palette.up : palette.down
          const hit = r.winRatePct != null && r.sampleYears != null
            ? Math.round(r.winRatePct / 100 * r.sampleYears) : null
          return (
            <Pressable
              key={r.id}
              onPress={() => onOpenDetail(r.market, r.ticker, r.name)}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', gap: 8,
                backgroundColor: (buy ? palette.upSoft : palette.downSoft) ?? palette.surfaceAlt,
                borderRadius: 10, paddingHorizontal: 11, paddingVertical: 9,
                borderLeftWidth: 3, borderLeftColor: c,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: c, fontSize: 13, fontWeight: '900' }} numberOfLines={1}>
                  {buy ? '📈' : '📉'} {r.name} — {r.month}월 {buy ? '강세' : '약세'} 진행 중
                </Text>
                <Text style={{ color: palette.inkSub, fontSize: 11, marginTop: 2 }}>
                  {hit != null ? `${r.sampleYears}년 중 ${hit}년 ${buy ? '상승' : '하락'}` : '역사적 패턴'}
                  {r.meanPct != null ? ` · 평균 ${r.meanPct >= 0 ? '+' : ''}${r.meanPct.toFixed(1)}%` : ''}
                  {buy ? '' : ' · 신규 진입 주의'}
                </Text>
              </View>
              <Text style={{ color: palette.inkFaint, fontSize: 10, fontWeight: '700' }}>{r.market}·{r.ticker}</Text>
            </Pressable>
          )
        })}
      </View>
      <Text style={[styles.metaText, { marginTop: 6 }]}>과거 통계 기반 참고용 — 미래 보장 아님</Text>
    </View>
  )
}
