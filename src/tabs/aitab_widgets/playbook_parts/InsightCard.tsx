import { useState } from 'react'
import { Linking, Pressable, Text, View } from 'react-native'
import { AlertTriangle, Sparkles, TrendingDown, TrendingUp } from 'lucide-react-native'
import type { MarketInsightData } from '../../../types'
import type { Palette } from '../../../theme'

type Props = {
  insight: MarketInsightData
  palette: Palette
}

/**
 * 근거 기반 시황 — 데이터 품질/관측 시각과 해석을 구분한다.
 */
export function InsightCard({ insight, palette }: Props) {
  const [expanded, setExpanded] = useState(false)
  const assessment = insight.assessment
  const regimeLabel = assessment ? ({
    INSUFFICIENT_DATA: '판단 보류', RISK_CAUTION: '위험 주의',
    SUPPORTIVE: '우호 조건', PRESSURED: '부담 우세', MIXED: '혼재',
  }[assessment.regime] ?? '검토 중') : '검증 전'
  const sentimentColor =
    insight.sentiment === 'BULLISH' ? palette.up :
    insight.sentiment === 'BEARISH' ? palette.down : palette.inkSub
  const SentimentIcon =
    insight.sentiment === 'BULLISH' ? TrendingUp :
    insight.sentiment === 'BEARISH' ? TrendingDown : AlertTriangle

  return (
    <View style={{
      backgroundColor: palette.surface,
      borderRadius: 14, borderWidth: 1, borderColor: palette.border,
      padding: 16, gap: 10,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Sparkles size={13} color={palette.purple} strokeWidth={2.5} />
        <Text style={{ color: palette.inkFaint, fontSize: 9, fontWeight: '800', letterSpacing: 1.5, flex: 1 }}>
          시데 · 근거 기반 시황
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <SentimentIcon size={11} color={sentimentColor} strokeWidth={2.5} />
          <Text style={{ color: sentimentColor, fontSize: 10, fontWeight: '800' }}>
            {regimeLabel}
          </Text>
        </View>
      </View>
      <Text style={{ color: palette.ink, fontSize: 16, fontWeight: '900', lineHeight: 22 }}>
        {insight.headline}
      </Text>
      <Text style={{ color: palette.inkSub, fontSize: 12, lineHeight: 18 }}>
        {insight.summary}
      </Text>
      {assessment ? (
        <View style={{ gap: 5 }}>
          <Text style={{ color: palette.inkMuted, fontSize: 11, lineHeight: 17 }}>
            유효 입력 {assessment.coveragePercent}% · 적중률이 아니야
          </Text>
          <Text style={{ color: palette.inkFaint, fontSize: 11, lineHeight: 17 }}>
            분석 {Number.isFinite(Date.parse(assessment.asOf)) ? new Date(assessment.asOf).toLocaleString('ko-KR') : '시각 미확인'} · {assessment.rulesVersion}
          </Text>
        </View>
      ) : null}
      <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)} style={{ paddingVertical: 10 }}>
        <Text style={{ color: palette.purple, fontSize: 12, fontWeight: '700' }}>{expanded ? '분석 근거 접기' : '지표·관측 시각·제외 사유 보기'}</Text>
      </Pressable>
      {expanded && insight.keyPoints.length > 0 ? (
        <View style={{ gap: 4 }}>
          {insight.keyPoints.map((pt, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
              <Text style={{ color: palette.purple, fontSize: 11, fontWeight: '800', marginTop: 1 }}>·</Text>
              <Text style={{ color: palette.inkMuted, fontSize: 11, lineHeight: 16, flex: 1 }}>{pt}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {expanded && assessment ? (
        <View style={{ gap: 10 }}>
          {assessment.evidence.filter(e => e.sourceUrl && e.source).map(e => (
            <Pressable key={e.id} accessibilityRole="link" onPress={() => {
              if (e.sourceUrl?.startsWith('https://')) void Linking.openURL(e.sourceUrl).catch(() => {})
            }}>
              <Text style={{ color: palette.purple, fontSize: 11 }}>{e.label} · {e.source} 출처 확인</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  )
}

/** 데이터 로드 전 placeholder — Gemini 호출 시간 동안 노출. */
export function InsightCardSkeleton({ palette }: { palette: Palette }) {
  return (
    <View style={{
      backgroundColor: palette.surface,
      borderRadius: 14, borderWidth: 1, borderColor: palette.border,
      padding: 16, gap: 10,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Sparkles size={13} color={palette.inkFaint} strokeWidth={2.5} />
        <Text style={{ color: palette.inkFaint, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 }}>
          시데 · 근거 기반 시황
        </Text>
      </View>
      <Text style={{ color: palette.inkMuted, fontSize: 13, lineHeight: 19 }}>
        시황 근거 불러오는 중…
      </Text>
      <Text style={{ color: palette.inkFaint, fontSize: 11, lineHeight: 16 }}>
        지표의 관측 시각과 품질을 확인하고 있어.
      </Text>
    </View>
  )
}
