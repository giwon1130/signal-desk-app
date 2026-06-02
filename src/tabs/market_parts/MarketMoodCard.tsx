import { useState } from 'react'
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { Info, Thermometer, X } from 'lucide-react-native'
import { useStyles } from '../../styles'
import type { CompositeRiskSignal, SummaryMetric } from '../../types'
import { getCompositeRiskPalette, getRiskScoreColor } from '../../utils'

type Props = {
  risk: CompositeRiskSignal | null
  metrics: SummaryMetric[]
}

/**
 * 오늘 시장 분위기 — 기존 "종합 위험도" + "시장 요약 지표"를 한 카드로 통합.
 * 1~10 분위기 점수(hero) + 세부 지표를 하나로 묶고, 어려운 용어는 쉬운 말로 바꿔 보여준다.
 */

// 어려운 지표명 → 쉬운 말. 백엔드 라벨을 화면에서만 친근하게 치환.
const FRIENDLY_LABEL: Record<string, string> = {
  'PizzINT 종합': '시장 신호 종합',
  PizzINT: '시장 신호 종합',
  'CBOE VIX': '변동성(공포지수)',
  'VIX 변동성': '변동성(공포지수)',
  VIX: '변동성(공포지수)',
  '뉴스 키워드': '뉴스 분위기',
  'Fear Meter': '공포·탐욕',
  'KR Heat': '한국 과열도',
  'US Heat': '미국 과열도',
  'Flow Bias': '외국인·기관 수급',
}
const friendly = (label: string) => FRIENDLY_LABEL[label] ?? FRIENDLY_LABEL[label.trim()] ?? label

type Indicator = { label: string; score: number; state: string; detail: string }

export function MarketMoodCard({ risk, metrics }: Props) {
  const styles = useStyles()
  const [open, setOpen] = useState(false)

  // 세부 지표 통합 — 위험도 구성요소 우선, 겹치지 않는 요약 지표를 뒤에 덧붙임(쉬운 이름으로 중복 제거).
  const indicators: Indicator[] = []
  const seen = new Set<string>()
  for (const c of risk?.components ?? []) {
    const label = friendly(c.label)
    if (seen.has(label)) continue
    seen.add(label)
    indicators.push({ label, score: c.score, state: c.state, detail: c.detail })
  }
  for (const m of metrics) {
    const label = friendly(m.label)
    if (seen.has(label)) continue
    seen.add(label)
    indicators.push({ label, score: m.score, state: m.state, detail: m.note })
  }

  if (!risk && indicators.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.cardTitleRow}>
            <Thermometer size={14} color="#f59e0b" strokeWidth={2.5} />
            <Text style={styles.cardTitle}>오늘 시장 분위기</Text>
          </View>
        </View>
        <View style={styles.riskEmptyBox}>
          <Text style={styles.metaText}>분위기 분석을 준비하고 있습니다</Text>
        </View>
      </View>
    )
  }

  const palette = risk ? getCompositeRiskPalette(risk.score) : null
  const asOf = risk?.asOf?.slice(0, 16).replace('T', ' ') ?? ''

  return (
    <>
      <Pressable
        onPress={() => risk && setOpen(true)}
        disabled={!risk}
        style={({ pressed }) => [styles.card, pressed && risk ? { opacity: 0.7 } : null]}
      >
        <View style={styles.sectionHeaderRow}>
          <View style={styles.cardTitleRow}>
            <Thermometer size={14} color={palette?.accent ?? '#f59e0b'} strokeWidth={2.5} />
            <Text style={styles.cardTitle}>오늘 시장 분위기</Text>
          </View>
          {risk ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.metaText}>탭하면 설명</Text>
              <Info size={12} color="#94a3b8" strokeWidth={2} />
            </View>
          ) : null}
        </View>

        {risk && palette ? (
          <View style={styles.riskHeroRow}>
            <View style={[styles.riskScoreBox, { backgroundColor: palette.backgroundColor, borderColor: palette.borderColor }]}>
              <Text style={[styles.riskScoreValue, { color: palette.accent }]}>{risk.score}</Text>
              <Text style={[styles.riskScoreOutOf, { color: palette.accent }]}>/ 10</Text>
              <Text style={[styles.riskLevelBadge, { backgroundColor: palette.badgeBackgroundColor, color: palette.badgeTextColor }]}>
                {risk.level}
              </Text>
            </View>
            <Text style={styles.riskHeadline}>{risk.headline}</Text>
          </View>
        ) : null}

        {indicators.map((ind) => (
          <IndicatorRow key={ind.label} indicator={ind} />
        ))}

        {risk?.personalImpact ? <Text style={styles.riskPersonalImpact}>{risk.personalImpact}</Text> : null}

        <Text style={styles.riskFootnote}>시장 신호·변동성·뉴스를 종합한 참고 지표입니다</Text>
      </Pressable>

      {risk ? (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <Pressable style={styles.signalModalBackdrop} onPress={() => setOpen(false)}>
            <Pressable style={styles.signalModalCard} onPress={(e) => e.stopPropagation()}>
              <View style={styles.signalModalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.signalModalTitle}>오늘 시장 분위기 {risk.score}/10</Text>
                  <Text style={styles.signalModalSubtitle}>{risk.level} · 100점 환산 {risk.score100}점</Text>
                </View>
                <Pressable onPress={() => setOpen(false)} hitSlop={12}>
                  <X size={18} color="#64748b" />
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 440 }}>
                <View style={styles.signalModalSection}>
                  <Text style={styles.signalModalSectionTitle}>이게 무엇입니까?</Text>
                  <Text style={styles.signalModalBody}>{risk.description}</Text>
                </View>

                <View style={styles.signalModalSection}>
                  <Text style={styles.signalModalSectionTitle}>어떻게 계산합니까?</Text>
                  <Text style={styles.signalModalBody}>{risk.methodology}</Text>
                </View>

                <View style={styles.signalModalSection}>
                  <Text style={styles.signalModalSectionTitle}>지금 보고 있는 지표</Text>
                  {risk.components.map((c) => (
                    <Text key={c.label} style={styles.signalModalBody}>
                      · {friendly(c.label)} (비중 {Math.round(c.weight * 100)}%) — {c.score}/100, {c.state}
                    </Text>
                  ))}
                </View>

                <Text style={styles.signalModalDisclaimer}>
                  시장 분위기는 참고용 보조 신호입니다. 이것만으로 매매하지 말고 가격·수급·뉴스랑 같이 봐 주세요.
                  {'\n'}기준 시각 {asOf}
                </Text>
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </>
  )
}

function IndicatorRow({ indicator }: { indicator: Indicator }) {
  const styles = useStyles()
  const color = getRiskScoreColor(indicator.score)
  const pct = Math.max(0, Math.min(100, indicator.score))
  return (
    <View style={styles.riskComponentRow}>
      <View style={styles.riskComponentHead}>
        <Text style={[styles.riskComponentLabel, { flex: 1 }]} numberOfLines={1}>{indicator.label}</Text>
        <Text style={[styles.riskComponentScore, { color }]}>{Math.round(indicator.score)}</Text>
      </View>
      <View style={styles.riskTrack}>
        <View style={[styles.riskTrackFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.riskComponentDetail} numberOfLines={2}>
        <Text style={[styles.riskComponentState, { color }]}>{indicator.state}</Text>
        {indicator.detail ? ` · ${indicator.detail}` : ''}
      </Text>
    </View>
  )
}
