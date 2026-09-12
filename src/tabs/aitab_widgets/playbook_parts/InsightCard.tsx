import { useState, type ReactNode } from 'react'
import { Linking, Pressable, Text, View } from 'react-native'
import { AlertTriangle, Sparkles, TrendingDown, TrendingUp } from 'lucide-react-native'
import type { MarketInsightData } from '../../../types'
import type { Palette } from '../../../theme'

type Props = {
  insight: MarketInsightData
  palette: Palette
}

/** 사용자용 해설과 검증용 상세 근거를 분리한 시황 카드. */
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

  const strongestFactors = assessment
    ? assessment.factors
      .filter((factor) => factor.score != null)
      .sort((a, b) => Math.abs((b.score ?? 0) * b.weight) - Math.abs((a.score ?? 0) * a.weight))
      .slice(0, 4)
    : []
  const strongestEvidenceIds = new Set(strongestFactors.flatMap((factor) => factor.evidenceIds))
  const strongestEvidence = assessment
    ? assessment.evidence
      .filter((evidence) => strongestEvidenceIds.has(evidence.id) && ['OBSERVED', 'DELAYED'].includes(evidence.status))
      .slice(0, 8)
    : []
  const sourceEvidence = assessment
    ? assessment.evidence
      .filter((evidence) => (
        strongestEvidenceIds.has(evidence.id) || ['^VIX', 'CL=F'].includes(evidence.id)
      ) && evidence.sourceUrl && evidence.source)
      .slice(0, 10)
    : []
  const excludedCount = assessment
    ? assessment.evidence.filter((evidence) => !['OBSERVED', 'DELAYED'].includes(evidence.status)).length
    : 0
  const nightFuturesExcluded = assessment?.evidence.some(
    (evidence) => evidence.id === 'KR_NIGHT' && evidence.status !== 'OBSERVED',
  ) ?? false
  const analyzedAt = assessment && Number.isFinite(Date.parse(assessment.asOf))
    ? new Date(assessment.asOf).toLocaleString('ko-KR')
    : '시각을 확인할 수 없습니다'
  const coverageLabel = !assessment ? null
    : assessment.coveragePercent >= 85 ? '분석에 필요한 데이터가 충분합니다'
    : assessment.coveragePercent >= 65 ? '일부 데이터가 제한된 상태입니다'
    : '판단에 필요한 데이터가 부족합니다'

  return (
    <View style={{
      backgroundColor: palette.surface,
      borderRadius: 14, borderWidth: 1, borderColor: palette.border,
      padding: 16, gap: 10,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Sparkles size={13} color={palette.purple} strokeWidth={2.5} />
        <Text style={{ color: palette.inkFaint, fontSize: 9, fontWeight: '800', letterSpacing: 1.5, flex: 1 }}>
          시데 · 오늘의 시장 해설
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
      <Text style={{ color: palette.inkSub, fontSize: 13, lineHeight: 21 }}>
        {insight.summary}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded(!expanded)}
        style={{ paddingVertical: 10 }}
      >
        <Text style={{ color: palette.purple, fontSize: 12, fontWeight: '700' }}>
          {expanded ? '판단 근거 접기' : '왜 이렇게 판단했는지 보기'}
        </Text>
      </Pressable>

      {expanded ? (
        <View style={{ gap: 14 }}>
          {assessment && strongestFactors.length > 0 ? (
            <DetailSection title="주요 흐름" palette={palette}>
              {strongestFactors.map((factor) => (
                <DetailRow key={factor.id} palette={palette} text={`${factor.label}: ${factor.interpretation}`} />
              ))}
            </DetailSection>
          ) : insight.keyPoints.length > 0 ? (
            <DetailSection title="주요 흐름" palette={palette}>
              {insight.keyPoints.slice(0, 4).map((point, index) => (
                <DetailRow key={index} palette={palette} text={point} />
              ))}
            </DetailSection>
          ) : null}

          {strongestEvidence.length > 0 ? (
            <DetailSection title="수치로 확인하기" palette={palette}>
              {strongestEvidence.map((evidence) => (
                <DetailRow key={evidence.id} palette={palette} text={evidence.detail} />
              ))}
            </DetailSection>
          ) : null}

          {assessment ? (
            <DetailSection title="데이터 안내" palette={palette}>
              <DetailRow palette={palette} text={coverageLabel ?? ''} />
              <DetailRow palette={palette} text={`${analyzedAt} 기준으로 분석했습니다.`} />
              {excludedCount > 0 ? (
                <DetailRow palette={palette} text={`${excludedCount}개 지표는 최신성이나 출처를 확인하기 어려워 판단에서 제외했습니다.`} />
              ) : null}
              {nightFuturesExcluded ? (
                <DetailRow palette={palette} text="야간선물 데이터는 아직 연결되지 않아 이번 분석에서 제외했습니다." />
              ) : null}
              <DetailRow palette={palette} text="이 내용은 현재 시장 상황을 설명하며 매수·매도 지시나 수익률 예측이 아닙니다." />
            </DetailSection>
          ) : null}

          {sourceEvidence.length > 0 ? (
            <DetailSection title="데이터 출처" palette={palette}>
              {sourceEvidence.map((evidence) => (
                <Pressable key={evidence.id} accessibilityRole="link" onPress={() => {
                  if (evidence.sourceUrl?.startsWith('https://')) {
                    void Linking.openURL(evidence.sourceUrl).catch(() => {})
                  }
                }}>
                  <Text style={{ color: palette.purple, fontSize: 11, lineHeight: 18 }}>
                    {evidence.label} · {evidence.source}
                  </Text>
                </Pressable>
              ))}
            </DetailSection>
          ) : null}
        </View>
      ) : null}
    </View>
  )
}

function DetailSection({
  title, palette, children,
}: { title: string; palette: Palette; children: ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: palette.ink, fontSize: 11, fontWeight: '800' }}>{title}</Text>
      {children}
    </View>
  )
}

function DetailRow({ text, palette }: { text: string; palette: Palette }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
      <Text style={{ color: palette.purple, fontSize: 11, fontWeight: '800', marginTop: 1 }}>·</Text>
      <Text style={{ color: palette.inkMuted, fontSize: 11, lineHeight: 17, flex: 1 }}>{text}</Text>
    </View>
  )
}

/** 데이터 로드 전 placeholder. */
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
          시데 · 오늘의 시장 해설
        </Text>
      </View>
      <Text style={{ color: palette.inkMuted, fontSize: 13, lineHeight: 19 }}>
        오늘의 시장 흐름을 정리하고 있습니다…
      </Text>
      <Text style={{ color: palette.inkFaint, fontSize: 11, lineHeight: 16 }}>
        최신 지표와 뉴스 흐름을 함께 확인하고 있습니다.
      </Text>
    </View>
  )
}
