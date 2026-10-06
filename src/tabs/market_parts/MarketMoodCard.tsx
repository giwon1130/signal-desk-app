import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import type { MarketCondition } from '../../types/market'
import { useTheme } from '../../theme'
import { conditionDataLabel, observationLabel } from '../../utils/marketCondition'

type Props = { conditions?: MarketCondition[]; marketPreference: 'KR' | 'US' | 'BOTH' }

/** Shared native/web presentation. Direction, external risk and data quality never share a score/color axis. */
export function MarketMoodCard({ conditions = [], marketPreference }: Props) {
  const { palette } = useTheme()
  const [tab, setTab] = useState<'KR' | 'US'>('KR')
  const [expanded, setExpanded] = useState(false)
  const market = marketPreference === 'BOTH' ? tab : marketPreference
  const condition = conditions.find((item) => item.market === market)
  const directionColor = condition?.direction === 'UP' ? palette.up : condition?.direction === 'DOWN' ? palette.down : palette.inkSub
  const riskColor = condition?.riskLevel === 'HIGH' || condition?.riskLevel === 'ELEVATED' ? palette.orange : palette.inkSub
  return (
    <View style={{ backgroundColor: palette.surface, borderColor: palette.border, borderWidth: 1, borderRadius: 18, padding: 18, gap: 14 }}>
      <Text accessibilityRole="header" style={{ color: palette.ink, fontSize: 17, fontWeight: '800' }}>오늘 시장 분위기</Text>
      {marketPreference === 'BOTH' ? (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['KR', 'US'] as const).map((value) => (
            <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: market === value }}
              onPress={() => setTab(value)} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 10, backgroundColor: market === value ? palette.surfaceAlt : palette.surface }}>
              <Text style={{ color: market === value ? palette.ink : palette.inkMuted, fontWeight: '700' }}>{value === 'KR' ? '한국' : '미국'}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {!condition ? <Text style={{ color: palette.inkMuted, lineHeight: 20 }}>검증된 시장 자료를 확인 중입니다. 이전 방식의 위험 점수는 표시하지 않습니다.</Text> : <>
        <Text style={{ color: palette.inkMuted, fontSize: 12 }}>
          {condition.horizon === 'CURRENT_SESSION' ? '장중 흐름 · 지연 시세 포함' : '최근 거래일 흐름 · 다음 개장 전망 아님'}
        </Text>
        <View style={{ gap: 8, backgroundColor: palette.surfaceAlt, padding: 14, borderRadius: 12 }}>
          <Text style={{ color: directionColor, fontSize: 15, fontWeight: '800' }}>시장 흐름 · {condition.directionLabel}</Text>
          <Text style={{ color: riskColor, fontSize: 13 }}>외부 위험 · {condition.riskLabel}</Text>
          <Text style={{ color: palette.inkMuted, fontSize: 12 }}>자료 상태 · {conditionDataLabel(condition.dataStatus)}</Text>
        </View>
        <Text style={{ color: palette.ink, fontSize: 16, fontWeight: '700', lineHeight: 24 }}>{condition.headline}</Text>
        <Text style={{ color: palette.inkSub, fontSize: 13, lineHeight: 21 }}>{condition.summary}</Text>
        <View style={{ borderLeftWidth: 2, borderLeftColor: riskColor, paddingLeft: 12, gap: 6 }}>
          <Text style={{ color: palette.inkSub, fontSize: 12, fontWeight: '700' }}>확인할 점</Text>
          {condition.watchPoints.map((point) => <Text key={point} style={{ color: palette.inkSub, fontSize: 12, lineHeight: 19 }}>{point}</Text>)}
        </View>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded((value) => !value)}
          style={{ minHeight: 44, justifyContent: 'center', borderTopWidth: 1, borderColor: palette.border }}>
          <Text style={{ color: palette.inkSub, fontSize: 12, fontWeight: '700' }}>자료와 기준 {expanded ? '닫기' : '열기'}</Text>
        </Pressable>
        {expanded ? <View style={{ gap: 12 }}>
          {condition.evidence.map((item) => <View key={item.id} style={{ gap: 3 }}>
            <Text style={{ color: palette.inkSub, fontSize: 12, lineHeight: 19 }}>{item.detail}</Text>
            <Text style={{ color: palette.inkMuted, fontSize: 11 }}>{item.source ?? '출처 미확인'} · {observationLabel(item.observedAt ?? item.observationDate)}</Text>
          </View>)}
          <Text style={{ color: palette.inkMuted, fontSize: 11 }}>분석 갱신 {observationLabel(condition.asOf)} · {condition.rulesVersion}</Text>
          <Text style={{ color: palette.inkMuted, fontSize: 11, lineHeight: 17 }}>시장 흐름은 주요 지수의 관측 결과입니다. 외부 위험은 브리프와 같은 자료로 판단하며, 매수 적합성이나 손실 확률을 뜻하지 않습니다.</Text>
        </View> : null}
      </>}
    </View>
  )
}
