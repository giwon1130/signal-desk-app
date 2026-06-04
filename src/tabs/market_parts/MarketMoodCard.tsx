import { useState } from 'react'
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { Info, Thermometer, X } from 'lucide-react-native'
import { useStyles } from '../../styles'
import type { CompositeRiskSignal, SummaryMetric } from '../../types'
import { getCompositeRiskPalette, getRiskScoreColor } from '../../utils'

type MarketPref = 'KR' | 'US' | 'BOTH'

type Props = {
  krRisk: CompositeRiskSignal | null
  usRisk: CompositeRiskSignal | null
  metrics: SummaryMetric[]
  marketPreference: MarketPref
}

/**
 * 오늘 시장 분위기 — 한국/미국 투자자 관점으로 분리한 위험도.
 * 시장 선호가 BOTH 면 KR/US 탭으로 전환, KR/US 면 해당 시장만 노출.
 * 위험도(hero) + 시장별 구성요소·요약 지표를 하나로 묶고 어려운 용어는 쉬운 말로 바꿔 보여준다.
 */

// 어려운 지표명 → 쉬운 말. 백엔드 라벨을 화면에서만 친근하게 치환.
const FRIENDLY_LABEL: Record<string, string> = {
  'PizzINT 종합': '시장 신호 종합',
  PizzINT: '시장 신호 종합',
  'CBOE VIX': '美 변동성(VIX)',
  'VIX 변동성': '美 변동성(VIX)',
  VIX: '美 변동성(VIX)',
  '한국 지수 변동': '한국 지수 변동',
  '뉴스 키워드': '뉴스 분위기',
  'Fear Meter': '공포·탐욕',
  'KR Heat': '한국 과열도',
  'US Heat': '미국 과열도',
  'Flow Bias': '외국인·기관 수급',
}
const friendly = (label: string) => FRIENDLY_LABEL[label] ?? FRIENDLY_LABEL[label.trim()] ?? label

// 요약 지표가 어느 시장 소속인지 — 선택 탭에 맞는 것만 노출.
const METRIC_MARKET: Record<string, 'KR' | 'US'> = {
  'Fear Meter': 'US',
  'US Heat': 'US',
  'KR Heat': 'KR',
  'Flow Bias': 'KR',
}

type Indicator = { label: string; score: number; state: string; detail: string }

export function MarketMoodCard({ krRisk, usRisk, metrics, marketPreference }: Props) {
  const styles = useStyles()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'KR' | 'US'>('KR')

  const showKr = marketPreference !== 'US'
  const showUs = marketPreference !== 'KR'
  const bothShown = showKr && showUs
  // 선호가 한쪽이면 그쪽 고정, BOTH 면 탭 상태를 따른다.
  const activeTab: 'KR' | 'US' = !showKr ? 'US' : !showUs ? 'KR' : tab
  const risk = activeTab === 'KR' ? krRisk : usRisk

  // 세부 지표 통합 — 위험도 구성요소 우선, 겹치지 않는 요약 지표(선택 시장 소속)를 뒤에.
  const indicators: Indicator[] = []
  const seen = new Set<string>()
  for (const c of risk?.components ?? []) {
    const label = friendly(c.label)
    if (seen.has(label)) continue
    seen.add(label)
    indicators.push({ label, score: c.score, state: c.state, detail: c.detail })
  }
  for (const m of metrics) {
    if ((METRIC_MARKET[m.label] ?? activeTab) !== activeTab) continue
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

        {/* KR/US 탭 — 시장 선호가 BOTH 일 때만 노출 */}
        {bothShown ? (
          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 2 }}>
            {(['KR', 'US'] as const).map((m) => {
              const active = activeTab === m
              return (
                <Pressable
                  key={m}
                  onPress={() => setTab(m)}
                  accessibilityRole="button"
                  accessibilityLabel={m === 'KR' ? '한국 시장 분위기' : '미국 시장 분위기'}
                  style={{
                    flexDirection: 'row', alignItems: 'center',
                    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999,
                    backgroundColor: active ? '#2563eb22' : 'transparent',
                    borderWidth: 1, borderColor: active ? '#2563eb' : '#3341552a',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '800', color: active ? '#2563eb' : '#94a3b8' }}>
                    {m === 'KR' ? '🇰🇷 한국' : '🇺🇸 미국'}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        ) : null}

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

        <Text style={styles.riskFootnote}>한국·미국 시장을 각각 변동성·뉴스로 종합한 참고 지표입니다</Text>
      </Pressable>

      {risk ? (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <Pressable style={styles.signalModalBackdrop} onPress={() => setOpen(false)}>
            <Pressable style={styles.signalModalCard} onPress={(e) => e.stopPropagation()}>
              <View style={styles.signalModalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.signalModalTitle}>
                    {activeTab === 'KR' ? '🇰🇷 한국' : '🇺🇸 미국'} 시장 분위기 {risk.score}/10
                  </Text>
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
