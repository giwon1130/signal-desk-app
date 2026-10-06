import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import type { PreMarketDirection, PreMarketForecastStats } from '../../types/market'
import { useTheme } from '../../theme'
import { canShowPremarketStats, observationLabel } from '../../utils/marketCondition'

type Props = { data?: PreMarketDirection | null; stats?: PreMarketForecastStats | null; onUpgrade?: () => void }

export function PreMarketDirectionCard({ data, stats, onUpgrade }: Props) {
  const { palette } = useTheme()
  const [expanded, setExpanded] = useState(false)
  if (!data || (!data.locked && data.status === 'OUTSIDE_WINDOW' && !stats)) return null
  const available = !!data.rulesVersion
  const quotes = data.overseas ?? []
  return <View style={{ backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: 18, padding: 18, gap: 12 }}>
    <Text accessibilityRole="header" style={{ color: palette.ink, fontSize: 17, fontWeight: '800' }}>야간·장전 흐름</Text>
    <Text style={{ color: palette.inkMuted, fontSize: 12, lineHeight: 19 }}>한국 거래일 06:30~09:00 · 밤사이 여건을 확인하는 참고 정보입니다.</Text>
    {data.locked ? <>
      <Text style={{ color: palette.inkSub, fontSize: 13, lineHeight: 21 }}>확인된 해외 시세와 자료의 최신 여부를 함께 살펴봅니다. 다음 개장 방향이나 수익을 보장하지 않습니다.</Text>
      <Pressable accessibilityRole="button" onPress={onUpgrade} style={{ minHeight: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 10, backgroundColor: palette.surfaceAlt }}>
        <Text style={{ color: palette.ink, fontWeight: '700' }}>PRO 이용 안내</Text>
      </Pressable>
    </> : <>
      <View style={{ padding: 14, borderRadius: 12, backgroundColor: palette.surfaceAlt, gap: 8 }}>
        <Text style={{ color: palette.ink, fontSize: 15, fontWeight: '800' }}>{available ? data.biasLabel ?? '장전 자료 확인 중' : '현재 장전 분석이 제공되지 않습니다'}</Text>
        <Text style={{ color: palette.inkSub, fontSize: 13, lineHeight: 21 }}>{available ? data.summary : '제공 시간과 최신 자료를 확인한 후 안내합니다.'}</Text>
      </View>
      <Text style={{ color: palette.inkSub, fontSize: 12, lineHeight: 19 }}>
        {data.nightFutures ? '한국 야간선물 실측을 포함합니다.' : '한국 야간선물 실측은 확인되지 않았습니다. 해외 참고지표와 구분해 주세요.'}
      </Text>
      {stats ? <View style={{ gap: 4 }}>
        <Text style={{ color: palette.inkSub, fontSize: 12, fontWeight: '700' }}>개장 결과 비교 · 검증 중</Text>
        <Text style={{ color: palette.inkMuted, fontSize: 11, lineHeight: 18 }}>
          {canShowPremarketStats(stats)
            ? '방향을 제시하고 결과가 확인된 ' + stats.evaluatedCount + '건 중 ' + stats.correctCount + '건이 일치했습니다(' + stats.accuracyPct + '%).'
            : '충분한 비교 자료가 쌓이기 전에는 일치율을 표시하지 않습니다.'}
          {'\n'}판단을 보류한 날은 이 비율에 포함되지 않으며, 예측 성능 검증이 완료된 것은 아닙니다.
        </Text>
      </View> : null}
      {available ? <>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded((value) => !value)} style={{ minHeight: 44, justifyContent: 'center' }}>
          <Text style={{ color: palette.inkSub, fontSize: 12, fontWeight: '700' }}>실측·참고지표와 유의사항 {expanded ? '닫기' : '열기'}</Text>
        </Pressable>
        {expanded ? <View style={{ gap: 12 }}>
          {[...(data.nightFutures ? [data.nightFutures] : []), ...quotes].map((quote) => <View key={quote.label} style={{ gap: 3 }}>
            <Text style={{ color: palette.inkSub, fontSize: 12 }}>{quote.label} · {quote.changeRate >= 0 ? '+' : ''}{quote.changeRate.toFixed(2)}%{quote.isProxy ? ' (해외 참고)' : ' (야간선물 실측)'}</Text>
            <Text style={{ color: palette.inkMuted, fontSize: 11 }}>{quote.source ?? '출처 미확인'} · {observationLabel(quote.observedAt)}</Text>
          </View>)}
          {(data.warnings ?? []).map((warning) => <Text key={warning} style={{ color: palette.inkMuted, fontSize: 11, lineHeight: 18 }}>{warning}</Text>)}
          <Text style={{ color: palette.inkMuted, fontSize: 11 }}>자료 반영 {data.coverage ?? 0}% · 분석 갱신 {observationLabel(data.asOf)}</Text>
        </View> : null}
      </> : null}
    </>}
  </View>
}
